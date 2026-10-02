const palette = {
  green: '#235B37',
  dark: '#173F29',
  light: '#EDF4E8',
  ink: '#17251C',
  white: '#FFFFFF',
  warm: '#F7F3E8',
};

function id(prefix = 'blk') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function block(type, values = {}) {
  return {
    id: id(),
    type,
    backgroundColor: palette.white,
    textColor: palette.ink,
    paddingTop: 58,
    paddingBottom: 58,
    ...values,
  };
}

export const PAGE_TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank Page',
    description: 'Start with an empty canvas and add your own sections.',
    pageType: 'PAGE',
    showHeader: true,
    showFooter: true,
    fullWidth: false,
    build: () => [],
  },
  {
    id: 'product-campaign',
    name: 'Product Campaign',
    description: 'Hero, featured products, trust copy, CTA and FAQ.',
    pageType: 'LANDING',
    showHeader: true,
    showFooter: true,
    fullWidth: true,
    build: () => [
      block('hero', {
        backgroundColor: palette.dark,
        textColor: palette.white,
        title: 'Special Collection',
        subtitle: 'Discover selected products with quality you can trust.',
        image: '',
        buttonText: 'Shop Now',
        buttonUrl: '/shop',
        buttonColor: palette.green,
        buttonTextColor: palette.white,
        align: 'left',
        minHeight: 540,
        overlay: 40,
        backgroundPosition: 'center',
      }),
      block('products', {
        heading: 'Featured Products',
        productIds: [],
        columns: 4,
        showComparePrice: true,
      }),
      block('imageText', {
        backgroundColor: palette.light,
        heading: 'Why shop with Arone Bd?',
        text: 'Carefully selected products, clear information and convenient ordering across Bangladesh.',
        image: '',
        imageSide: 'left',
        buttonText: 'Explore Products',
        buttonUrl: '/shop',
        buttonColor: palette.green,
        buttonTextColor: palette.white,
      }),
      block('cta', {
        backgroundColor: palette.dark,
        textColor: palette.white,
        heading: 'Ready to order?',
        text: 'Choose your favourite products and place your order today.',
        buttonText: 'Order Now',
        buttonUrl: '/shop',
        buttonColor: palette.white,
        buttonTextColor: palette.dark,
      }),
      block('faq', {
        heading: 'Frequently Asked Questions',
        items: [
          { q: 'How do I order?', a: 'Select a product, add it to cart and complete checkout.' },
          { q: 'Can I pay on delivery?', a: 'Available payment and delivery options are shown during checkout.' },
        ],
      }),
    ],
  },
  {
    id: 'gift-collection',
    name: 'Gift Collection',
    description: 'A warm gift-focused landing page with story and product sections.',
    pageType: 'LANDING',
    showHeader: true,
    showFooter: true,
    fullWidth: true,
    build: () => [
      block('hero', {
        backgroundColor: '#74563A',
        textColor: palette.white,
        title: 'Gifts Made Memorable',
        subtitle: 'Thoughtfully chosen gift ideas for the people who matter.',
        image: '',
        buttonText: 'Browse Gifts',
        buttonUrl: '/shop',
        buttonColor: '#C89B62',
        buttonTextColor: '#FFFFFF',
        align: 'center',
        minHeight: 560,
        overlay: 38,
        backgroundPosition: 'center',
      }),
      block('text', {
        backgroundColor: palette.warm,
        heading: 'Choose something meaningful',
        text: 'Create a simple collection story here. Explain who the products are for and why the collection is special.',
      }),
      block('products', {
        heading: 'Popular Gift Picks',
        productIds: [],
        columns: 4,
        showComparePrice: true,
      }),
      block('cta', {
        backgroundColor: '#F4E9DA',
        heading: 'Find the right gift today',
        text: 'Browse the full collection and choose your favourite.',
        buttonText: 'See All Products',
        buttonUrl: '/shop',
        buttonColor: '#74563A',
        buttonTextColor: palette.white,
      }),
    ],
  },
  {
    id: 'flash-sale',
    name: 'Flash Sale',
    description: 'A compact high-conversion offer layout for ads and promotions.',
    pageType: 'LANDING',
    showHeader: false,
    showFooter: false,
    fullWidth: true,
    build: () => [
      block('hero', {
        backgroundColor: '#8E2D24',
        textColor: palette.white,
        title: 'Limited Time Offer',
        subtitle: 'Highlight the deal, urgency and the strongest reason to buy now.',
        image: '',
        buttonText: 'Get The Offer',
        buttonUrl: '#products',
        buttonColor: '#F3C65B',
        buttonTextColor: '#3C2915',
        align: 'center',
        minHeight: 500,
        overlay: 45,
        backgroundPosition: 'center',
      }),
      block('products', {
        heading: 'Offer Products',
        productIds: [],
        columns: 3,
        showComparePrice: true,
      }),
      block('cta', {
        backgroundColor: '#FFF3D5',
        heading: 'Offer ends soon',
        text: 'Use this section for a final purchase reminder.',
        buttonText: 'Order Now',
        buttonUrl: '/shop',
        buttonColor: '#8E2D24',
        buttonTextColor: palette.white,
      }),
    ],
  },
  {
    id: 'brand-story',
    name: 'About / Brand Story',
    description: 'A normal content page for your business story and trust message.',
    pageType: 'PAGE',
    showHeader: true,
    showFooter: true,
    fullWidth: false,
    build: () => [
      block('hero', {
        backgroundColor: palette.dark,
        textColor: palette.white,
        title: 'About Arone Bd',
        subtitle: 'Share what your brand stands for and what customers can expect.',
        image: '',
        buttonText: '',
        buttonUrl: '',
        buttonColor: palette.green,
        buttonTextColor: palette.white,
        align: 'center',
        minHeight: 380,
        overlay: 30,
        backgroundPosition: 'center',
      }),
      block('imageText', {
        heading: 'Our Story',
        text: 'Write your company story, mission and the reason behind Arone Bd.',
        image: '',
        imageSide: 'left',
        buttonText: '',
        buttonUrl: '',
        buttonColor: palette.green,
        buttonTextColor: palette.white,
      }),
      block('text', {
        backgroundColor: palette.light,
        heading: 'Our Promise',
        text: 'Explain your quality, service and customer experience commitments.',
      }),
    ],
  },
  {
    id: 'faq-policy',
    name: 'FAQ / Policy Page',
    description: 'A clean information page for delivery, returns or ordering help.',
    pageType: 'PAGE',
    showHeader: true,
    showFooter: true,
    fullWidth: false,
    build: () => [
      block('text', {
        heading: 'Important Information',
        text: 'Add an introduction or policy summary here.',
      }),
      block('faq', {
        heading: 'Frequently Asked Questions',
        items: [
          { q: 'Question one', a: 'Write the answer here.' },
          { q: 'Question two', a: 'Write the answer here.' },
          { q: 'Question three', a: 'Write the answer here.' },
        ],
      }),
    ],
  },
];

export function applyPageTemplate(templateId) {
  const template = PAGE_TEMPLATES.find((item) => item.id === templateId);
  if (!template) return null;

  return {
    pageType: template.pageType,
    showHeader: template.showHeader,
    showFooter: template.showFooter,
    fullWidth: template.fullWidth,
    content: template.build(),
  };
}
