export const ROUTES = {
    HOMEPAGE_ROUTE: '/',
    LOGIN_ROUTE: '/login',
    REGISTER_ROUTE: '/register',
    EXPLORER_ROUTE: '/explorer',
    TEST_ROUTE: '/test'
} as const;

export const SYSTEM_PAGE_CODES = {
    LAYOUT: 'sys-page-layout',
    HOME_ROOT: 'sys-page-home-root',
    LOGIN: 'sys-page-login',
    REGISTER: 'sys-page-register',
    EXPLORER_ROOT: 'sys-page-explorer-root',
    TEST: 'sys-page-test',
} as const;

export const SYSTEM_PAGE_ID_BY_CODE: Record<string, string> = {
    'sys-page-layout': '798fbede-4599-4fea-8754-3d049cba5b25',
    'sys-page-home-root': '48dc08f0-215f-4629-8b8f-0065a4681577',
    'sys-page-login': '86853451-5386-4525-abc1-808ee2424741',
    'sys-page-register': 'dbbe5609-21bd-410f-8880-eb4e838736e0',
    'sys-page-explorer-root': '22f9f37a-4d33-4037-818c-2854ea611d24',
    'sys-page-test': '00cd2cb4-ea58-4e48-8dc5-e8a1dd7c4491',
};