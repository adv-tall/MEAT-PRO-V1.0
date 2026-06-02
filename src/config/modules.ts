import { MENU_ITEMS } from './menu';

export const SYSTEM_MODULES: any[] = [];

let currentCategory = '';
MENU_ITEMS.forEach(item => {
  if (item.category && item.category !== 'TOP' && item.category !== currentCategory) {
    SYSTEM_MODULES.push({
      id: `heading_${item.category.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      isHeading: true,
      label: item.category
    });
    currentCategory = item.category;
  }
  
  SYSTEM_MODULES.push({
    id: item.id,
    label: item.name,
    icon: item.icon,
    isHeading: false,
    subItems: item.subItems?.map(sub => ({
      id: sub.id,
      label: sub.name
    }))
  });
});
