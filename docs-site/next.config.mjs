import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/docs/microsoft',
        destination: '/docs/automatisierungen/microsoft',
        permanent: false,
      },
      {
        source: '/docs/crewmeister',
        destination: '/docs/automatisierungen/crewmeister',
        permanent: false,
      },
      {
        source: '/docs/automatisierungen/automatisierungen/:path*',
        destination: '/docs/automatisierungen/:path*',
        permanent: false,
      },
      {
        source: '/docs/automatisierungen/automationen/:path*',
        destination: '/docs/automatisierungen/:path*',
        permanent: false,
      },
      {
        source: '/docs/automatisierungen/extra-funktionen/:path*',
        destination: '/docs/extra-funktionen/:path*',
        permanent: false,
      },
      {
        source: '/docs/admin-pingen',
        destination: '/docs/extra-funktionen/admin-pingen',
        permanent: false,
      },
      {
        source: '/docs/Automatisierung_anlegen',
        destination: '/docs/automatisierungen',
        permanent: false,
      },
      {
        source: '/docs/schedules',
        destination: '/docs/extra-funktionen/geplante-deaktivierung',
        permanent: false,
      },
      {
        source: '/docs/hintergrundjobs',
        destination: '/docs/firmenjubilaeum',
        permanent: false,
      },
    ];
  },
};

export default withMDX(config);
