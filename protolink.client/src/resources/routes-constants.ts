export const ROUTES = {
    HOMEPAGE_ROUTE: '/',
    LOGIN_ROUTE: '/login',
    REGISTER_ROUTE: '/register',
    CONFIRM_EMAIL_ROUTE: '/confirm-email',
    FORGOT_PASSWORD_ROUTE: '/forgot-password',
    RESET_PASSWORD_ROUTE: '/reset-password',
    /** Signed-in change password — auth-gated; before /:id. Distinct from forgot/reset. */
    CHANGE_PASSWORD_ROUTE: '/change-password',
    /** Guest-link entry: /share/{token} — redeem then replace to /{entityId} (AT-S4). */
    SHARE_ROUTE: '/share/:token',
    EXPLORER_ROUTE: '/explorer',
    TEST_ROUTE: '/test'
} as const;

export const SYSTEM_PAGE_CODES = {
    LAYOUT: 'sys-page-layout',
    HOME_ROOT: 'sys-page-home-root',
    LOGIN: 'sys-page-login',
    REGISTER: 'sys-page-register',
    CONFIRM_EMAIL: 'sys-page-confirm-email',
    SHARE_REDEEM: 'sys-page-share-redeem',
    EXPLORER_ROOT: 'sys-page-explorer-root',
    TEST: 'sys-page-test',
} as const;

export const SYSTEM_PAGE_ID_BY_CODE: Record<string, string> = {
    'sys-page-layout': '798fbede-4599-4fea-8754-3d049cba5b25',
    'sys-page-home-root': '48dc08f0-215f-4629-8b8f-0065a4681577',
    'sys-page-login': '86853451-5386-4525-abc1-808ee2424741',
    'sys-page-register': 'dbbe5609-21bd-410f-8880-eb4e838736e0',
    /** Live Api hosts (seeded 2026-10-24; content-manager may re-verify / extend) */
    'sys-page-confirm-email': 'e17cc2a0-07dd-4541-8a7a-8a1f785aa731',
    'sys-page-share-redeem': 'd01455f4-d57b-4353-a95a-05178ca6e9a5',
    'sys-page-explorer-root': '22f9f37a-4d33-4037-818c-2854ea611d24',
    'sys-page-test': '00cd2cb4-ea58-4e48-8dc5-e8a1dd7c4491',
};