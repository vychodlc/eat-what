import { Hono } from 'hono';

const categoryRouter = new Hono();

categoryRouter.get('/list', async (c) => {
  const { db } = c.env;
  const categories = await db('t_categories').select('*').orderBy('f_create_time', 'asc');
  return c.json({ success: true, data: categories });
});

categoryRouter.post('/save', async (c) => {
  const { db } = c.env;
  const body = await c.req.json();
  const { f_id, ...data } = body;

  if (f_id) {
    await db('t_categories').where('f_id', f_id).update(data);
  } else {
    await db('t_categories').insert(data);
  }
  return c.json({ success: true });
});

categoryRouter.delete('/:id', async (c) => {
  const { db } = c.env;
  const id = c.req.param('id');
  await db('t_categories').where('f_id', id).del();
  return c.json({ success: true });
});

export default categoryRouter;