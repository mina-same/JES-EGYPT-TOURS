import Menu from '../models/Menu';

export const seedMenus = async (): Promise<void> => {
  const key = 'header-main';

  const payload = {
    key,
    title: { en: 'Header Main Menu', de: 'Hauptmenü Kopfzeile', it: 'Menu principale intestazione' },
    isActive: true,
    items: [
      { label: { en: 'Home', de: 'Startseite', it: 'Home' }, url: '/', isActive: true, order: 0, children: [] },
      {
        label: { en: 'Tours', de: 'Touren', it: 'Tour' },
        url: '/search',
        isActive: true,
        order: 1,
        children: [
          { label: { en: 'All Tours', de: 'Alle Touren', it: 'Tutti i Tour' }, url: '/search', isActive: true, order: 0, children: [] },
          { label: { en: 'Popular Tours', de: 'Beliebte Touren', it: 'Tour Popolari' }, url: '/tours/popular', isActive: true, order: 1, children: [] },
        ],
      },
      {
        label: { en: 'Blogs', de: 'Blogs', it: 'Blog' },
        url: '/blogs/all',
        isActive: true,
        order: 2,
        children: [
          { label: { en: 'All Blog Posts', de: 'Alle Blogbeiträge', it: 'Tutti i post del blog' }, url: '/blogs/all', isActive: true, order: 0, children: [] },
          { label: { en: 'Popular', de: 'Beliebt', it: 'Popolare' }, url: '/blogs/all?sort=popular', isActive: true, order: 1, children: [] },
        ],
      },
      { label: { en: 'About', de: 'Über uns', it: 'Chi siamo' }, url: '/about', isActive: true, order: 3, children: [] },
      { label: { en: 'Contact', de: 'Kontakt', it: 'Contatti' }, url: '/contact', isActive: true, order: 4, children: [] },
    ],
  };

  await Menu.findOneAndUpdate({ key }, payload as any, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });
};
