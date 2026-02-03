import { Hono } from 'hono';

const adminRouter = new Hono();

// Check if user is admin
adminRouter.get('/check', async (c) => {
  const { db, user } = c.env;
  const admin = await db('t_admins').where('f_work_no', user.workNo).first();
  return c.json({ isAdmin: !!admin });
});

// Get all admins
adminRouter.get('/list', async (c) => {
  const { db } = c.env;
  const admins = await db('t_admins').select('*');
  return c.json({ success: true, data: admins });
});

// Add admin
adminRouter.post('/add', async (c) => {
  const { db } = c.env;
  const { workNo } = await c.req.json();
  await db('t_admins').insert({ f_work_no: workNo });
  return c.json({ success: true });
});

export default adminRouter;