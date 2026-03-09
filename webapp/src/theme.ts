import {
  Button,
  Image,
  type MantineThemeOverride,
  Title,
  createTheme,
  rem,
} from '@mantine/core';

export const imageFallbackSrc = '/placeholder.jpg';

const primaryShade = {
  light: 6,
  dark: 8,
} as const;
const createThemeArgs: MantineThemeOverride = {
  primaryShade: primaryShade,
  primaryColor: 'blue',
  fontFamily: 'Libre Franklin, sans-serif',
  components: {
    Image: Image.extend({
      defaultProps: {
        fallbackSrc: imageFallbackSrc,
      },
    }),
    Button: Button.extend({
      defaultProps: {
        h: rem(36),
      },
    }),
    Title: Title.extend({
      defaultProps: {
        h: rem(36),
      },
    }),
  },
} as const;

export const theme: MantineThemeOverride = createTheme(createThemeArgs);
export const primaryColorLight = theme.colors?.blue?.[primaryShade.light];
export const primaryColorDark = theme.colors?.blue?.[primaryShade.dark];
