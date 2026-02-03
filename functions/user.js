import { Hono } from 'hono';

const userRouter = new Hono();

// History
userRouter.get('/history', async (c) => {
  const { db, user } = c.env;
  const history = await db('t_history as h')
    .join('t_restaurants as r', 'h.f_restaurant_id', 'r.f_id')
    .select('h.*', 'r.f_name', 'r.f_image_url', 'r.f_rating', 'r.f_price_range')
    .where('h.f_work_no', user.workNo)
    .orderBy('h.f_create_time', 'desc')
    .limit(50);
  return c.json({ success: true, data: history });
});

userRouter.post('/history/add', async (c) => {
  const { db, user } = c.env;
  const { restaurantId } = await c.req.json();
  await db('t_history').insert({
    f_work_no: user.workNo,
    f_restaurant_id: restaurantId
  });
  return c.json({ success: true });
});

// Favorites
userRouter.get('/favorites', async (c) => {
  const { db, user } = c.env;
  const favorites = await db('t_favorites as f')
    .join('t_restaurants as r', 'f.f_restaurant_id', 'r.f_id')
    .select('f.*', 'r.f_name', 'r.f_image_url', 'r.f_rating', 'r.f_price_range', 'r.f_category_id')
    .where('f.f_work_no', user.workNo)
    .orderBy('f.f_create_time', 'desc');
  return c.json({ success: true, data: favorites });
});

userRouter.post('/favorites/toggle', async (c) => {
  const { db, user } = c.env;
  const { restaurantId } = await c.req.json();
  
  const existing = await db('t_favorites')
    .where({ f_work_no: user.workNo, f_restaurant_id: restaurantId })
    .first();

  if (existing) {
    await db('t_favorites').where('f_id', existing.f_id).del();
    return c.json({ success: true, action: 'removed' });
  } else {
    await db('t_favorites').insert({
      f_work_no: user.workNo,
      f_restaurant_id: restaurantId
    });
    return c.json({ success: true, action: 'added' });
  }
});

export default userRouter;