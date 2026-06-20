import { createVuetify } from 'vuetify';
import type { IconAliases } from 'vuetify';
import 'vuetify/styles';
import colors from 'vuetify/util/colors';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';

import { getSystemTheme } from '@/utils/theme';

export function createExtensionVuetify(iconAliases: Partial<IconAliases> = {}) {
    return createVuetify({
        theme: {
            defaultTheme: getSystemTheme(),
            themes: {
                light: {
                    colors: {
                        background: colors.grey.lighten5,
                        surface: colors.shades.white,
                        primary: colors.red.base,
                        secondary: colors.red.lighten4,
                        'primary-hover': colors.red.darken1,
                        border: colors.grey.lighten2,
                        muted: colors.grey.darken1,
                        'icon-preview-background': colors.grey.lighten4,
                        'on-primary': colors.shades.white,
                        'on-surface': '#111827',
                    },
                },
                dark: {
                    dark: true,
                    colors: {
                        background: '#121212',
                        surface: '#1e1e1e',
                        primary: colors.red.darken4,
                        secondary: colors.red.lighten4,
                        'primary-hover': colors.red.darken3,
                        border: colors.grey.darken3,
                        muted: colors.grey.lighten1,
                        'icon-preview-background': '#2a2a2a',
                        'on-primary': colors.shades.white,
                        'on-surface': colors.grey.lighten4,
                    },
                },
            },
        },
        icons: {
            defaultSet: 'mdi',
            aliases: {
                ...aliases,
                ...iconAliases,
            },
            sets: {
                mdi,
            },
        },
    });
}
