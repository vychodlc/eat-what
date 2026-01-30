"use client";

import { useEffect, useState, useRef, useCallback } from "react";

// 餐厅类型定义
interface Restaurant {
  id: number;
  name: string;
  address: string;
  type: string;
  distance: string;
}

// 颜色配置
const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
  "#F8B500",
  "#00CED1",
];

export default function Home() {
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [remainingRestaurants, setRemainingRestaurants] = useState<
    Restaurant[]
  >([]);
  const [currentResult, setCurrentResult] = useState<Restaurant | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locationText, setLocationText] = useState("正在获取位置...");
  const [showResultModal, setShowResultModal] = useState(false);
  const [rotation, setRotation] = useState(0);
  const animationRef = useRef<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 从 localStorage 读取缓存数据
  useEffect(() => {
    if (typeof window === "undefined") return;

    const cached = localStorage.getItem("eat-what-restaurants");
    if (cached) {
      try {
        const data = JSON.parse(cached);
        if (Array.isArray(data) && data.length > 0) {
          setAllRestaurants(data);
          setRemainingRestaurants(data);
          setLocationText("📍 " + (localStorage.getItem("eat-what-location") || "缓存数据"));
        }
      } catch (e) {
        console.error("解析缓存数据失败", e);
      }
    }
    setLoading(false);
  }, []);

  // 手动刷新
  const handleRefresh = () => {
    setIsRefreshing(true);
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await fetchRestaurantsByGps(position.coords.latitude, position.coords.longitude);
        setIsRefreshing(false);
      },
      async () => {
        await fetchRestaurantsByIP();
        setIsRefreshing(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // 根据选项生成 conic-gradient 背景
  const getGradient = useCallback(() => {
    if (remainingRestaurants.length === 0) return "conic-gradient(#ddd 0deg, #ddd 360deg)";

    const sliceDeg = 360 / remainingRestaurants.length;
    let gradient = "conic-gradient(";

    remainingRestaurants.forEach((_, index) => {
      const color = COLORS[index % COLORS.length];
      const startDeg = index * sliceDeg;
      const endDeg = (index + 1) * sliceDeg;
      gradient += `${color} ${startDeg}deg ${endDeg}deg,`;
    });

    gradient = gradient.slice(0, -1) + ")";
    return gradient;
  }, [remainingRestaurants]);

  // 启动时自动尝试加载
  useEffect(() => {
    loadRestaurants();
  }, []);

  // 清理动画帧
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // 加载餐厅数据（启动时自动尝试）
  const loadRestaurants = () => {
    if (typeof window === "undefined") return;

    setLoading(true);
    setLocationText("正在获取位置...");

    if (!navigator.geolocation) {
      // 浏览器不支持 GPS，直接用 IP 定位
      fetchRestaurantsByIP();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await fetchRestaurantsByGps(position.coords.latitude, position.coords.longitude);
      },
      async (err) => {
        // GPS 定位失败，使用 IP 定位
        setLocationText("📍 GPS定位失败，使用IP定位...");
        await fetchRestaurantsByIP();
      },
      { enableHighAccuracy: true }
    );
  };

  // GPS 定位获取餐厅
  const fetchRestaurantsByGps = async (lat: number, lng: number) => {
    const apiKey = "19a2543f904ca7235dbe2963da0b467f";

    try {
      const geoUrl = `https://restapi.amap.com/v3/geocode/regeo?location=${lng},${lat}&key=${apiKey}`;
      const geoResponse = await fetch(geoUrl);
      const geoData = await geoResponse.json();

      const address = geoData.status === "1" && geoData.regeocode
        ? geoData.regeocode.formatted_address
        : "未知位置";
      setLocationText(`📍 ${address}`);

      await searchNearbyRestaurants(lng, lat, address);
    } catch (error) {
      console.error("GPS定位获取失败:", error);
      await fetchRestaurantsByIP();
    }
  };

  // IP 定位获取餐厅
  const fetchRestaurantsByIP = async () => {
    const apiKey = "19a2543f904ca7235dbe2963da0b467f";

    try {
      const ipUrl = `https://restapi.amap.com/v3/ip?key=${apiKey}`;
      const ipResponse = await fetch(ipUrl);
      const ipData = await ipResponse.json();

      if (ipData.status === "1" && ipData.city) {
        setLocationText(`📍 ${ipData.province}${ipData.city}`);
        await searchNearbyByCity(ipData.city, `${ipData.province}${ipData.city}`);
      } else {
        setLocationText("📍 定位失败");
        setAllRestaurants([]);
        setRemainingRestaurants([]);
        setLoading(false);
      }
    } catch (error) {
      console.error("IP定位获取失败:", error);
      setLocationText("📍 定位失败");
      setAllRestaurants([]);
      setRemainingRestaurants([]);
      setLoading(false);
    }
  };

  // 根据坐标搜索附近餐厅
  const searchNearbyRestaurants = async (lng: number, lat: number, address: string) => {
    const apiKey = "19a2543f904ca7235dbe2963da0b467f";
    const pageSize = 25; // 高德地图API单页最大返回25条
    const maxPages = 4; // 最多获取4页，共100条

    try {
      const allRestaurantsData: any[] = [];

      // 分页获取餐厅数据
      for (let page = 1; page <= maxPages; page++) {
        const url = `https://restapi.amap.com/v3/place/around?location=${lng},${lat}&keywords=餐饮&types=050000&radius=2000&key=${apiKey}&page=${page}&offset=${pageSize}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === "1" && data.pois && data.pois.length > 0) {
          allRestaurantsData.push(...data.pois);

          // 如果返回的数据少于pageSize，说明已经是最后一页了
          if (data.pois.length < pageSize) {
            break;
          }
        } else {
          break;
        }
      }

      if (allRestaurantsData.length > 0) {
        const restaurants = allRestaurantsData.map((poi: any, index: number) => ({
          id: index,
          name: poi.name,
          address: poi.address || "地址未知",
          distance: poi.distance ? `${poi.distance}米` : "距离未知",
          type: poi.type || "餐饮",
        }));

        localStorage.setItem("eat-what-restaurants", JSON.stringify(restaurants));
        localStorage.setItem("eat-what-location", address);

        setAllRestaurants(restaurants);
        setRemainingRestaurants(restaurants);
      } else {
        setAllRestaurants([]);
        setRemainingRestaurants([]);
      }
    } catch (error) {
      console.error("搜索餐厅失败:", error);
      setAllRestaurants([]);
      setRemainingRestaurants([]);
    }
    setLoading(false);
  };

  // 根据城市搜索餐厅（IP定位时使用矩形区域）
  const searchNearbyByCity = async (city: string, address: string) => {
    const apiKey = "19a2543f904ca7235dbe2963da0b467f";
    const pageSize = 25; // 高德地图API单页最大返回25条
    const maxPages = 4; // 最多获取4页，共100条

    try {
      const allRestaurantsData: any[] = [];

      // 分页获取餐厅数据
      for (let page = 1; page <= maxPages; page++) {
        const url = `https://restapi.amap.com/v3/place/text?keywords=餐饮&types=050000&city=${city}&citylimit=true&key=${apiKey}&page=${page}&offset=${pageSize}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === "1" && data.pois && data.pois.length > 0) {
          allRestaurantsData.push(...data.pois);

          // 如果返回的数据少于pageSize，说明已经是最后一页了
          if (data.pois.length < pageSize) {
            break;
          }
        } else {
          break;
        }
      }

      if (allRestaurantsData.length > 0) {
        const restaurants = allRestaurantsData.map((poi: any, index: number) => ({
          id: index,
          name: poi.name,
          address: poi.address || "地址未知",
          distance: poi.distance ? `${poi.distance}米` : "距离未知",
          type: poi.type || "餐饮",
        }));

        localStorage.setItem("eat-what-restaurants", JSON.stringify(restaurants));
        localStorage.setItem("eat-what-location", address);

        setAllRestaurants(restaurants);
        setRemainingRestaurants(restaurants);
      } else {
        setAllRestaurants([]);
        setRemainingRestaurants([]);
      }
    } catch (error) {
      console.error("搜索餐厅失败:", error);
      setAllRestaurants([]);
      setRemainingRestaurants([]);
    }
    setLoading(false);
  };

  // 开始转动
  const spin = () => {
    if (isSpinning || remainingRestaurants.length === 0) return;

    setIsSpinning(true);
    setIsTransitioning(true);
    setShowResultModal(false);

    const itemCount = remainingRestaurants.length;
    const sliceDeg = 360 / itemCount;

    // 随机选择最终结果（数组中的索引）
    const targetIndex = Math.floor(Math.random() * itemCount);

    // 计算该扇区的中心角度（第0个扇区的中心在 sliceDeg/2 度）
    const targetSectorCenter = targetIndex * sliceDeg + sliceDeg / 2;

    // 计算需要旋转多少度才能让目标扇区的中心对准指针（0度/12点钟方向）
    // 因为转盘是顺时针旋转，所以需要旋转 360 - targetSectorCenter 度
    const baseRotation = 360 - targetSectorCenter;

    // 多转几圈增加悬念
    const totalRotations = 5 + Math.random() * 3;
    const spinRotation = totalRotations * 360 + baseRotation;

    const duration = 3000;
    const startTime = Date.now();
    const startRotation = rotation;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentRotation = startRotation + spinRotation * easeOut;

      setRotation(currentRotation);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // 动画结束，设置到最终角度
        setRotation(startRotation + spinRotation);

        // 等待一帧确保旋转完成后再停止 transition
        requestAnimationFrame(() => {
          setIsTransitioning(false);

          // 再等待一小段时间确保转盘完全停止
          setTimeout(() => {
            // 指针在12点钟方向（0度），选择我们之前计算好的目标餐厅
            const selected = remainingRestaurants[targetIndex];

            setIsSpinning(false);
            setCurrentResult(selected);
            setShowResultModal(true);
          }, 200);
        });
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  // 拒绝选择（移除并重新转）
  const rejectChoice = () => {
    if (!currentResult) return;

    const newRemaining = remainingRestaurants.filter(
      (r) => r.id !== currentResult.id
    );
    setRemainingRestaurants(newRemaining);
    setShowResultModal(false);

    if (newRemaining.length <= 1) {
      setRemainingRestaurants(allRestaurants);
      return;
    }

    setTimeout(() => spin(), 300);
  };

  // 确认选择
  const confirmChoice = () => {
    setShowResultModal(false);
    if (currentResult) {
      alert(`就去这家了！🍽️ ${currentResult.name}`);
    }
  };

  // 重新开始
  const restart = () => {
    setRemainingRestaurants(allRestaurants);
    setShowResultModal(false);
    setCurrentResult(null);
  };

  return (
    <div className="page">
      <main className="main">
        {/* 标题 */}
        <h1 className="title">🍽️ 随机吃饭</h1>

        {/* 位置信息 */}
        <div className="location-row">
          <p className="location">{locationText}</p>
          <button className="refresh-btn" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? "刷新中..." : "🔄 刷新"}
          </button>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="loading">
            <div className="spinner" />
            <p>定位中...</p>
          </div>
        )}

        {/* 空状态 */}
        {!loading && remainingRestaurants.length === 0 && (
          <div className="empty">
            <p>😢 附近没有找到餐厅</p>
            <p className="tip">点击刷新按钮重新获取</p>
          </div>
        )}

        {/* 转盘区域 */}
        {!loading && remainingRestaurants.length > 0 && (
          <>
            <div className="roulette-wrapper">
              {/* 指针 */}
              <div className="pointer" />

              {/* 转盘 */}
              <div
                className="roulette"
                style={{
                  background: getGradient(),
                  transform: `rotate(${rotation}deg)`,
                  transition: isTransitioning
                    ? "transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)"
                    : "none",
                }}
              >
                {/* 标签层 - 跟转盘一起旋转 */}
                <div className="labels-layer">
                  {remainingRestaurants.map((item, index) => {
                    const sliceDeg = 360 / remainingRestaurants.length;
                    const midDeg = index * sliceDeg + sliceDeg / 2;
                    return (
                      <div
                        key={item.id}
                        className="label"
                        style={{
                          transform: `rotate(${midDeg}deg)`,
                        }}
                      >
                        <span>{item.name.substring(0, 4)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* 中心圆 */}
                <div className="center" />
              </div>
            </div>

            <button
              className="spin-btn"
              onClick={spin}
              disabled={isSpinning || remainingRestaurants.length === 0}
            >
              {isSpinning ? "转动中..." : "🎲 随机吃"}
            </button>

            <p className="count">{remainingRestaurants.length} 家候选</p>
          </>
        )}

        {/* 选项太少提示 */}
        {remainingRestaurants.length <= 1 &&
          !showResultModal &&
          remainingRestaurants.length > 0 &&
          allRestaurants.length > 1 && (
            <div className="tip-modal">
              <p>😢 选项太少啦</p>
              <p>只剩 {remainingRestaurants.length} 个选项</p>
              <button onClick={() => setRemainingRestaurants(allRestaurants)}>
                恢复所有选项
              </button>
            </div>
          )}

        {/* 结果弹窗 */}
        {showResultModal && currentResult && (
          <div className="modal-overlay" onClick={() => setShowResultModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🎉 今日推荐</h2>
                <button onClick={() => setShowResultModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <h3>{currentResult.name}</h3>
                <p className="type">{currentResult.type}</p>
                <div className="detail">
                  <p>📍 {currentResult.address}</p>
                  <p>🚶 {currentResult.distance}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="dislike" onClick={rejectChoice}>
                  ❌ 不喜欢，再转
                </button>
                <button className="like" onClick={confirmChoice}>
                  ✅ 就这家了
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #f5f5f5;
        }
        .main {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-height: 100vh;
          padding: 40px 20px;
        }
        .title {
          font-size: 28px;
          font-weight: 600;
          color: #333;
          margin: 0 0 8px;
        }
        .location {
          font-size: 14px;
          color: #888;
          margin: 0;
        }
        .location-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 32px;
        }
        .refresh-btn {
          padding: 6px 12px;
          font-size: 13px;
          color: #666;
          background: #e5e5e5;
          border: none;
          border-radius: 15px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .refresh-btn:hover:not(:disabled) {
          background: #d5d5d5;
        }
        .refresh-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 80px;
        }
        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e5e5e5;
          border-top-color: #666;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .loading p {
          margin-top: 16px;
          color: #666;
        }
        .empty {
          text-align: center;
          margin-top: 80px;
          color: #666;
        }
        .empty p:first-child {
          font-size: 20px;
        }
        .tip {
          margin-top: 8px;
          font-size: 14px;
          color: #999;
        }
        .roulette-wrapper {
          position: relative;
          width: 320px;
          height: 320px;
        }
        .pointer {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          width: 0;
          height: 0;
          border-left: 14px solid transparent;
          border-right: 14px solid transparent;
          border-top: 24px solid #ff6b6b;
        }
        .roulette {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          position: relative;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          overflow: visible;
        }
        .labels-layer {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          pointer-events: none;
        }
        .label {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 50%;
          height: 24px;
          transform-origin: left center;
          display: flex;
          align-items: center;
          padding-left: 48px;
          box-sizing: border-box;
          margin-top: -12px;
        }
        .label span {
          color: white;
          font-size: 13px;
          font-weight: 500;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          white-space: nowrap;
        }
        .center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60px;
          height: 60px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        .spin-btn {
          margin-top: 24px;
          padding: 14px 48px;
          font-size: 18px;
          font-weight: 600;
          color: white;
          background: #4a5568;
          border: none;
          border-radius: 25px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .spin-btn:hover:not(:disabled) {
          transform: scale(1.05);
          background: #4a5568;
        }
        .spin-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .count {
          margin-top: 12px;
          font-size: 14px;
          color: #888;
        }
        .tip-modal {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 50;
        }
        .tip-modal p {
          color: #666;
          font-size: 18px;
        }
        .tip-modal p:first-child {
          font-weight: 600;
          margin-bottom: 8px;
        }
        .tip-modal button {
          margin-top: 20px;
          padding: 12px 32px;
          font-size: 16px;
          font-weight: 500;
          color: white;
          background: #4a5568;
          border: none;
          border-radius: 25px;
          cursor: pointer;
        }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
        }
        .modal {
          background: white;
          border-radius: 16px;
          max-width: 340px;
          width: 90%;
          overflow: hidden;
          animation: slideUp 0.3s ease;
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: #4a5568;
          color: white;
        }
        .modal-header h2 {
          margin: 0;
          font-size: 17px;
        }
        .modal-header button {
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
        }
        .modal-body {
          padding: 20px;
          text-align: center;
        }
        .modal-body h3 {
          margin: 0 0 6px;
          font-size: 22px;
          color: #333;
        }
        .type {
          font-size: 13px;
          color: #999;
          margin: 0 0 16px;
        }
        .detail {
          background: #f9f9f9;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
          color: #666;
        }
        .detail p {
          margin: 4px 0;
        }
        .modal-footer {
          display: flex;
          gap: 12px;
          padding: 16px 20px;
          border-top: 1px solid #f0f0f0;
        }
        .modal-footer button {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .dislike {
          background: #f5f5f5;
          color: #666;
        }
        .dislike:hover {
          background: #ff6b6b;
          color: white;
        }
        .like {
          background: #4a5568;
          color: white;
        }
        .like:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
}
