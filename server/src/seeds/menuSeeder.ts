import Menu from '../models/Menu';

export const seedMenus = async (): Promise<void> => {
  const key = 'header-main';

  const payload = {
    key,
    title: 'Header Main Menu',
    isActive: true,
    items: [
      { label: 'Home', url: '/', isActive: true, order: 0, children: [] },
      {
        label: 'Tours',
        url: '/search',
        isActive: true,
        order: 1,
        children: [
          { label: 'All Tours', url: '/search', isActive: true, order: 0, children: [] },
          { label: 'Popular Tours', url: '/tours/popular', isActive: true, order: 1, children: [] },
        ],
      },
      {
        label: 'Blogs',
        url: '/blogs/all',
        isActive: true,
        order: 2,
        children: [
          { label: 'All Blog Posts', url: '/blogs/all', isActive: true, order: 0, children: [] },
          { label: 'Popular', url: '/blogs/all?sort=popular', isActive: true, order: 1, children: [] },
        ],
      },
      { label: 'About', url: '/about', isActive: true, order: 3, children: [] },
      { label: 'Contact', url: '/contact', isActive: true, order: 4, children: [] },
    ],
  };

  await Menu.findOneAndUpdate({ key }, payload as any, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });
};
