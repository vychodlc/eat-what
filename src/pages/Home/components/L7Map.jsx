import React, { useEffect, useRef, useState } from 'react';
import { Scene, PointLayer, Marker } from '@antv/l7';
import { GaodeMap } from '@antv/l7-maps';
import { Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useFoodStore from '@/stores/useFoodStore.js';

const L7Map = ({ restaurants = [], selectedId = null }) => {
  const mapContainer = useRef(null);
  const sceneRef = useRef(null);
  const userMarkerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { userLocation, syncRestaurants } = useFoodStore();
  const hasCenteredOnUser = useRef(false);

  // Initialize Scene
  useEffect(() => {
    if (!mapContainer.current) return;

    const scene = new Scene({
      id: mapContainer.current,
      map: new GaodeMap({
        center: userLocation ? [userLocation.lng, userLocation.lat] : [120.15, 30.26],
        zoom: 13,
        style: 'light',
      }),
    });

    sceneRef.current = scene;

    scene.on('loaded', () => {
      setIsLoaded(true);
    });

    return () => {
      scene.destroy();
    };
  }, []);

  // Update user location marker and center
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !isLoaded || !userLocation) return;

    // Create or update user marker
    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'relative flex items-center justify-center';
      el.innerHTML = `
        <div class="absolute w-6 h-6 bg-blue-500/30 rounded-full animate-ping"></div>
        <div class="relative w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-lg"></div>
      `;
      
      const marker = new Marker({ element: el })
        .setLnglat([userLocation.lng, userLocation.lat]);
      
      scene.addMarker(marker);
      userMarkerRef.current = marker;
    } else {
      userMarkerRef.current.setLnglat([userLocation.lng, userLocation.lat]);
    }

    // Center on user once when location is first acquired
    if (!hasCenteredOnUser.current && userLocation) {
      try {
        scene.setCenter([userLocation.lng, userLocation.lat]);
        hasCenteredOnUser.current = true;
      } catch (e) {
        console.error('Failed to set center:', e);
      }
    }
  }, [userLocation, isLoaded]);

  // Update layers when restaurants or selectedId changes
  useEffect(() => {
    if (isLoaded) {
      updateLayers();
    }
  }, [restaurants, selectedId, isLoaded]);

  const updateLayers = () => {
    const scene = sceneRef.current;
    if (!scene || !isLoaded) return;

    // Remove existing point layers
    scene.getLayers().forEach(layer => {
      if (layer instanceof PointLayer) {
        scene.removeLayer(layer);
      }
    });

    if (restaurants.length === 0) return;

    const pointLayer = new PointLayer({ zIndex: 2 })
      .source(restaurants, {
        parser: { type: 'json', x: 'f_lng', y: 'f_lat' },
      })
      .shape('circle')
      .size('f_id', id => (id === selectedId ? 25 : 12))
      .color('f_id', id => (id === selectedId ? '#FF6B35' : '#2A4747'))
      .active(true)
      .style({
        opacity: 0.8,
        strokeWidth: 2,
        stroke: '#fff',
      });

    scene.addLayer(pointLayer);

    if (selectedId) {
      const selected = restaurants.find(r => r.f_id === selectedId);
      if (selected) {
        try {
          scene.setCenter([selected.f_lng, selected.f_lat]);
          scene.setZoom(15);
        } catch (e) {
          console.error('Failed to set center for selected restaurant:', e);
        }
      }
    }
  };

  const handleSyncNearby = async () => {
    if (!userLocation) return;
    setIsSyncing(true);
    const toastId = toast.loading('正在从高德地图探索周边美食...');

    try {
      // 动态加载 AMap.PlaceSearch 插件
      window.AMap.plugin(['AMap.PlaceSearch'], () => {
        const placeSearch = new window.AMap.PlaceSearch({
          type: '餐饮服务', // 搜索餐饮
          pageSize: 20,
          pageIndex: 1,
          city: '全国',
        });

        placeSearch.searchNearBy('', [userLocation.lng, userLocation.lat], 3000, async (status, result) => {
          if (status === 'complete' && result.info === 'OK') {
            const pois = result.poiList.pois.map(poi => ({
              name: poi.name,
              address: poi.address,
              lng: poi.location.lng,
              lat: poi.location.lat,
              type: poi.type,
              rating: poi.biz_ext?.rating,
              price: poi.biz_ext?.cost,
              tags: poi.type.split(';'),
              image: poi.photos?.[0]?.url
            }));

            const syncRes = await syncRestaurants(pois);
            toast.success(syncRes.message || '探索完成！', { id: toastId });
          } else {
            toast.error('未能在周边发现更多餐厅', { id: toastId });
          }
          setIsSyncing(false);
        });
      });
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('探索失败，请稍后再试', { id: toastId });
      setIsSyncing(false);
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Floating Sync Button */}
      <button
        onClick={handleSyncNearby}
        disabled={isSyncing || !userLocation}
        className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full shadow-lg hover:bg-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed z-10"
      >
        {isSyncing ? (
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        ) : (
          <Search className="w-4 h-4 text-primary" />
        )}
        <span className="text-sm font-medium text-gray-700">
          {isSyncing ? '正在探索...' : '探索真实美食'}
        </span>
      </button>
    </div>
  );
};

export default L7Map;