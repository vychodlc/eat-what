import { Hono } from 'hono';
import adminRouter from './admin.js';
import categoryRouter from './category.js';
import restaurantRouter from './restaurant.js';
import userRouter from './user.js';

const app = new Hono();

app.route('/admin', adminRouter);
app.route('/category', categoryRouter);
app.route('/restaurant', restaurantRouter);
app.route('/user', userRouter);

app.get('/ping', (c) => c.text('pong'));

export default app;