import boettcherLogo from './boettcher-logo.png';
import easyparkLogo from './easypark-logo.png';
import gcGruppeLogo from './gc-gruppe-logo.png';
import laponeLogo from './lapone-logo.png';
import luftkontorLogo from './luftkontor-logo.png';
import makitaLogo from './makita-logo.png';
import nupnauLogo from './nupnau-logo.png';
import obetaLogo from './obeta-logo.png';
import straussLogo from './strauss-logo.png';
import telekomLogo from './telekom-logo.png';
import wiedemannLogo from './wiedemann-logo.png';
import type { IntegrationProviderValue } from './integration.consts';

export const TOGGLE_ONLY_INTEGRATION_LOGOS = {
  gc_gruppe: gcGruppeLogo,
  lapone: laponeLogo,
  wiedemann: wiedemannLogo,
  nupnau: nupnauLogo,
  obeta: obetaLogo,
  luftkontor: luftkontorLogo,
  makita: makitaLogo,
  boettcher: boettcherLogo,
  strauss: straussLogo,
  telekom: telekomLogo,
  easypark: easyparkLogo,
} as const satisfies Partial<Record<IntegrationProviderValue, string>>;
