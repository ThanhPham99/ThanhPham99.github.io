// Sample data for ?demo=1, built through the public store API.
import { todayStr } from './domain.js';

const DAY = 86400000;
const daysAgo = (n) => Date.now() - n * DAY;
const dateAgo = (n) => todayStr(new Date(daysAgo(n)));
const dateAhead = (n) => todayStr(new Date(Date.now() + n * DAY));

export async function seedDemo(store) {
  const save = await store.addCategory({ name: 'Tiết kiệm', color: 'emerald', icon: 'piggy-bank' });
  const travel = await store.addCategory({ name: 'Du lịch', color: 'sky', icon: 'plane' });
  const invest = await store.addCategory({ name: 'Đầu tư', color: 'violet', icon: 'trending-up' });

  const plan = [
    { categoryId: save, name: 'Quỹ khẩn cấp', target: 60000000, tag: 'An toàn', deadline: dateAhead(150), created: 180,
      moves: [[170, 10000000], [120, 8000000], [60, 7000000], [20, 5000000]] },
    { categoryId: save, name: 'Bảo hiểm sức khỏe', target: 12000000, tag: 'An toàn', deadline: dateAhead(20), created: 200,
      moves: [[190, 3000000], [90, 3000000]] },
    { categoryId: save, name: 'Mua laptop', target: 35000000, deadline: dateAhead(90), created: 100,
      moves: [[95, 15000000], [40, 12000000], [10, 8000000]] },
    { categoryId: save, name: 'Điện thoại mới', target: 20000000, deadline: dateAhead(10), created: 150,
      moves: [[140, 12000000], [12, 8000000]] },
    { categoryId: travel, name: 'Đà Lạt', target: 8000000, tag: 'Trong nước', deadline: dateAhead(25), created: 60,
      moves: [[55, 2000000], [30, 2500000]] },
    { categoryId: travel, name: 'Phú Quốc', target: 15000000, tag: 'Trong nước', deadline: dateAhead(200), created: 30,
      moves: [[28, 3000000]] },
    { categoryId: travel, name: 'Nhật Bản', target: 60000000, deadline: dateAgo(5), created: 300,
      moves: [[290, 10000000], [200, 15000000], [100, 5000000]] },
    { categoryId: invest, name: 'Vàng SJC (chỉ)', target: 10, created: 240,
      moves: [[230, 2], [150, 1.5], [70, 1], [15, 0.5]] },
    { categoryId: invest, name: 'Quỹ ETF', target: 100000000, tag: 'Chứng khoán', deadline: dateAhead(365), created: 120,
      moves: [[110, 20000000], [80, 10000000], [50, -5000000], [20, 15000000]] },
    { categoryId: invest, name: 'Cổ phiếu ngân hàng', target: 50000000, tag: 'Chứng khoán', created: 90,
      moves: [[85, 10000000], [45, 6000000]] },
    { categoryId: travel, name: 'Hà Giang', target: 5000000, created: 400, archived: true,
      moves: [[390, 3000000], [300, 2000000]] },
  ];

  for (const p of plan) {
    const id = await store.addItem({
      categoryId: p.categoryId, name: p.name, target: p.target, tag: p.tag ?? null,
      deadline: p.deadline ?? null, note: '', createdAt: daysAgo(p.created),
    });
    for (const [ago, amount] of p.moves) await store.addEntry(id, { amount, date: dateAgo(ago), note: '' });
    if (p.archived) await store.setArchived(id, true);
  }
}
