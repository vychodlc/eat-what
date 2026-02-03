import { Hono } from 'hono';

const restaurantRouter = new Hono();

restaurantRouter.get('/list', async (c) => {
  const { db } = c.env;
  const { categoryId, minRating, search, lng, lat, radius = 3 } = c.req.query();
  
  let query = db('t_restaurants as r')
    .leftJoin('t_categories as c', 'r.f_category_id', 'c.f_id')
    .select('r.*', 'c.f_name as f_category_name');

  if (categoryId) query = query.where('r.f_category_id', categoryId);
  if (minRating) query = query.where('r.f_rating', '>=', minRating);
  if (search) query = query.where('r.f_name', 'like', `%${search}%`);

  // Simple distance filtering if coordinates are provided
  if (lng && lat) {
    // Use LEAST and GREATEST to clamp the value between -1 and 1 to avoid ACOS(NaN)
    const distanceSql = `(6371 * acos(GREATEST(-1, LEAST(1, cos(radians(${lat})) * cos(radians(f_lat)) * cos(radians(f_lng) - radians(${lng})) + sin(radians(${lat})) * sin(radians(f_lat))))))`;
    query = query.select(db.raw(`${distanceSql} AS distance`));
    query = query.orderBy('distance', 'asc');
  } else {
    query = query.orderBy('r.f_rating', 'desc');
  }

  const restaurants = await query;
  
  // Post-process to add is_nearby flag
  const result = restaurants.map(r => ({
    ...r,
    is_nearby: r.distance ? r.distance <= parseFloat(radius) : true
  }));

  return c.json({ success: true, data: result });
});

restaurantRouter.post('/initialize-nearby', async (c) => {
  const { db } = c.env;
  const { lng, lat } = await c.req.json();

  if (!lng || !lat) {
    return c.json({ success: false, error: 'Missing coordinates' }, 400);
  }

  // 1. Check if we already have enough restaurants in this area (roughly)
  const nearbySql = `(6371 * acos(GREATEST(-1, LEAST(1, cos(radians(${lat})) * cos(radians(f_lat)) * cos(radians(f_lng) - radians(${lng})) + sin(radians(${lat})) * sin(radians(f_lat))))))`;
  const existingNearby = await db('t_restaurants')
    .select(db.raw(`${nearbySql} AS distance`))
    .whereRaw(`${nearbySql} <= 1`) // Check 1km radius to avoid over-populating
    .limit(1);

  if (existingNearby.length > 0) {
    return c.json({ success: true, message: 'Already initialized for this area', initialized: false });
  }

  // 2. Get categories to assign
  const categories = await db('t_categories').select('f_id', 'f_name');
  if (categories.length === 0) {
    // Insert some default categories if none exist
    const defaultCats = [
      { f_name: '快餐简餐', f_icon: 'Utensils' },
      { f_name: '中式炒菜', f_icon: 'Flame' },
      { f_name: '西式料理', f_icon: 'Pizza' },
      { f_name: '日韩料理', f_icon: 'Soup' },
      { f_name: '甜点饮品', f_icon: 'Coffee' }
    ];
    await db('t_categories').insert(defaultCats);
    const newCats = await db('t_categories').select('f_id', 'f_name');
    categories.push(...newCats);
  }

  // 3. Generate mock restaurants
  const restaurantNames = [
    ['老王', '张姐', '阿强', '快乐', '深夜', '精致', '好味', '地道'],
    ['小馆', '食堂', '面馆', '大排档', '餐厅', '料理', '烘焙', '麻辣烫']
  ];

  const mockRestaurants = [];
  const count = 6 + Math.floor(Math.random() * 4); // 6-10 restaurants

  for (let i = 0; i < count; i++) {
    const name1 = restaurantNames[0][Math.floor(Math.random() * restaurantNames[0].length)];
    const name2 = restaurantNames[1][Math.floor(Math.random() * restaurantNames[1].length)];
    const cat = categories[Math.floor(Math.random() * categories.length)];
    
    // Offset by roughly 0-2km (0.018 degrees is ~2km)
    const offsetLat = (Math.random() - 0.5) * 0.03;
    const offsetLng = (Math.random() - 0.5) * 0.03;

    mockRestaurants.push({
      f_name: `${name1}${name2}`,
      f_category_id: cat.f_id,
      f_rating: (4 + Math.random() * 1).toFixed(1),
      f_price_range: ['￥20-40', '￥40-60', '￥60-100', '￥100+'][Math.floor(Math.random() * 4)],
      f_tags: JSON.stringify(['口碑好', '上菜快', '环境优雅'].slice(0, 1 + Math.floor(Math.random() * 2))),
      f_address: `美食街 ${100 + Math.floor(Math.random() * 800)} 号`,
      f_lng: parseFloat(lng) + offsetLng,
      f_lat: parseFloat(lat) + offsetLat,
      f_image_url: `https://www.weavefox.cn/api/bolt/unsplash_image?keyword=restaurant,food&width=800&height=600&random=${i}_${Date.now()}`,
      f_description: '这里是为您精心挑选的周边美食。'
    });
  }

  await db('t_restaurants').insert(mockRestaurants);

  return c.json({ success: true, message: `Successfully initialized ${count} nearby restaurants`, initialized: true });
});

restaurantRouter.get('/detail/:id', async (c) => {
  const { db } = c.env;
  const id = c.req.param('id');
  const restaurant = await db('t_restaurants as r')
    .leftJoin('t_categories as c', 'r.f_category_id', 'c.f_id')
    .select('r.*', 'c.f_name as f_category_name')
    .where('r.f_id', id)
    .first();
  return c.json({ success: true, data: restaurant });
});

restaurantRouter.post('/save', async (c) => {
  const { db } = c.env;
  const body = await c.req.json();
  const { f_id, f_category_name, ...data } = body;

  if (data.f_tags && typeof data.f_tags !== 'string') {
    data.f_tags = JSON.stringify(data.f_tags);
  }

  if (f_id) {
    await db('t_restaurants').where('f_id', f_id).update(data);
  } else {
    await db('t_restaurants').insert(data);
  }
  return c.json({ success: true });
});

restaurantRouter.delete('/:id', async (c) => {
  const { db } = c.env;
  const id = c.req.param('id');
  await db('t_restaurants').where('f_id', id).del();
  return c.json({ success: true });
});

// 同步真实餐厅数据
restaurantRouter.post('/sync', async (c) => {
  try {
    const { db } = c.env;
    const { restaurants } = await c.req.json();

    if (!restaurants || !Array.isArray(restaurants)) {
      return c.json({ success: false, message: '无效的数据格式' }, 400);
    }

    // 获取所有分类以进行匹配
    const categories = await db('t_categories').select('f_id', 'f_name');

    const results = [];
    for (const item of restaurants) {
      // 简单的去重逻辑：名称和地址同时匹配
      const exists = await db('t_restaurants')
        .where('f_name', item.name)
        .andWhere('f_address', item.address)
        .first();

      if (!exists) {
        // 尝试匹配分类
        let categoryId = 1; // 默认分类
        const matchedCat = categories.find(cat => item.type && item.type.includes(cat.f_name));
        if (matchedCat) categoryId = matchedCat.f_id;

        const [id] = await db('t_restaurants').insert({
          f_name: item.name,
          f_address: item.address,
          f_lng: item.lng,
          f_lat: item.lat,
          f_rating: item.rating || (3.5 + Math.random() * 1.5).toFixed(1),
          f_price_range: item.price || '￥20-80',
          f_tags: JSON.stringify(item.tags || []),
          f_image_url: item.image || `https://www.weavefox.cn/api/bolt/unsplash_image?keyword=restaurant,food&width=400&height=300&random=${encodeURIComponent(item.name)}`,
          f_description: item.type || '美食餐厅',
          f_category_id: categoryId,
        });
        results.push(id);
      }
    }

    return c.json({
      success: true,
      count: results.length,
      message: `成功同步 ${results.length} 家新餐厅`
    });
  } catch (error) {
    console.error('Sync error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default restaurantRouter;