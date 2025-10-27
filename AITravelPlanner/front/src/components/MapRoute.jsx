import React, { useEffect, useRef } from 'react';
import axios from 'axios';
import { AMAP_KEY, AMAP_SECURITY_CODE } from '../amapConfig';

// 动态加载高德地图 JS SDK
function loadAmapScript() {
  return new Promise((resolve, reject) => {
    if (window.AMap) return resolve(window.AMap);
    // 注入安全秘钥（需在加载 JS SDK 之前设置）
    if (AMAP_SECURITY_CODE && typeof AMAP_SECURITY_CODE === 'string') {
      window._AMapSecurityConfig = { securityJsCode: AMAP_SECURITY_CODE };
    }
    const script = document.createElement('script');
    // 仅加载基础 SDK，插件通过 AMap.plugin 动态加载，避免“不是构造函数”的错误
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}`;
    script.async = true;
    script.onload = () => resolve(window.AMap);
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
}

const MapRoute = ({ startAddress, endAddress, onSummary }) => {
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    let mapInstance;
    let driving;
    let geocoder;

    async function init() {
      try {
        const AMap = await loadAmapScript();

        // 如果未同时提供起点/终点，则不触发搜索，仅提示并提前返回，避免卡住
        if (!startAddress || !endAddress) {
          onSummary && onSummary({ info: '请输入起点和终点后再查询' });
          return;
        }

        // 确保插件加载完成后再构造 Geocoder / Driving
        await new Promise((resolve) => {
          AMap.plugin(['AMap.Geocoder', 'AMap.Driving'], () => resolve());
        });

        mapInstance = new AMap.Map(containerRef.current, {
          viewMode: '2D',
          zoom: 11,
          center: [116.397428, 39.90923],
        });
        mapRef.current = mapInstance;

        geocoder = new AMap.Geocoder();
        driving = new AMap.Driving({
          map: mapInstance,
          policy: AMap.DrivingPolicy.LEAST_TIME,
          showTraffic: true,
        });

        if (startAddress && endAddress) {
          // 解析地址阶段
          onSummary && onSummary({ info: '正在解析地址…' });

          // 为 geocoder 和 driving.search 添加超时保护，避免一直卡在进度中
          const withTimeout = (promise, ms, label) =>
            Promise.race([
              promise,
              new Promise((_, reject) => setTimeout(() => reject(new Error(`${label}超时`)), ms)),
            ]);

          const geocodeOne = async (address, which) => {
            try {
              // 前端 SDK 地理编码，带超时保护
              const loc = await withTimeout(
                new Promise((resolve, reject) => {
                  geocoder.getLocation(address, (status, result) => {
                    if (status === 'complete' && result.geocodes && result.geocodes.length) {
                      resolve(result.geocodes[0].location);
                    } else {
                      reject(new Error(`${which}地址解析失败`));
                    }
                  });
                }),
                12000,
                `${which}地址解析`
              );
              return loc;
            } catch (err) {
              // 前端解析失败或超时，尝试后端兜底
              onSummary && onSummary({ info: `${which}地址解析超时，尝试后端兜底…` });
              try {
                const { data } = await withTimeout(
                  axios.post('http://localhost:3000/api/map/geocode', { address }),
                  15000,
                  `${which}后端地理编码`
                );
                const lng = data?.location?.lng;
                const lat = data?.location?.lat;
                if (typeof lng === 'number' && typeof lat === 'number') {
                  return new AMap.LngLat(lng, lat);
                }
                throw new Error(`${which}后端地理编码失败`);
              } catch (e2) {
                throw new Error(`${which}地址解析失败`);
              }
            }
          };

          const [start, end] = await Promise.all([
            geocodeOne(startAddress, '起点'),
            geocodeOne(endAddress, '终点'),
          ]);
          // 统一将坐标转换为 AMap.LngLat，避免 Driving.search 参数不兼容
          const toLngLat = (val) => {
            if (!val) return null;
            if (val instanceof AMap.LngLat) return val;
            const lng = val.lng ?? (typeof val.getLng === 'function' ? val.getLng() : Array.isArray(val) ? val[0] : undefined);
            const lat = val.lat ?? (typeof val.getLat === 'function' ? val.getLat() : Array.isArray(val) ? val[1] : undefined);
            if (typeof lng === 'number' && typeof lat === 'number') return new AMap.LngLat(lng, lat);
            return null;
          };

          const startLngLat = toLngLat(start);
          const endLngLat = toLngLat(end);

          if (!startLngLat || !endLngLat) {
            onSummary && onSummary({ error: '坐标转换失败，请检查地址是否有效' });
            return;
          }

          // 路线规划阶段
          onSummary && onSummary({ info: '正在规划路线…' });

          const drivingSearch = (origin, dest) =>
            new Promise((resolve, reject) => {
              driving.search(origin, dest, (status, result) => {
                if (status === 'complete' && result.routes && result.routes.length) {
                  resolve(result);
                } else {
                  reject(new Error('未找到路线'));
                }
              });
            });

          let result;
          try {
            result = await withTimeout(drivingSearch(startLngLat, endLngLat), 15000, '路线规划');
          } catch (routeErr) {
            // 前端规划失败或超时，尝试后端兜底
            onSummary && onSummary({ info: '前端路线规划失败，尝试后端兜底…' });
            const payload = {
              origin: { lng: startLngLat.getLng(), lat: startLngLat.getLat() },
              destination: { lng: endLngLat.getLng(), lat: endLngLat.getLat() },
            };
            try {
              const { data } = await withTimeout(
                axios.post('http://localhost:3000/api/map/route', payload),
                20000,
                '后端路线规划'
              );
              if (data?.ok && data?.summary) {
                onSummary && onSummary(data.summary);
                return;
              }
              throw new Error('后端路线规划失败');
            } catch (fallbackErr) {
              throw fallbackErr;
            }
          }

          const route = result.routes[0];
          const summary = {
            distanceMeters: route.distance,
            durationSeconds: route.time,
            tolls: route.tolls || 0,
            stepsCount: route.steps?.length || 0,
          };
          onSummary && onSummary(summary);
        }
      } catch (e) {
        console.error('加载或初始化高德地图失败:', e);
        const msg = typeof e?.message === 'string' ? e.message : '地图加载失败';
        onSummary && onSummary({ error: msg });
      }
    }

    init();
    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, [startAddress, endAddress, onSummary]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '360px', borderRadius: 12, overflow: 'hidden' }} />
  );
};

export default MapRoute;