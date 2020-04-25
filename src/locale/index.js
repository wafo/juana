const i18next = require('i18next');
const logger = require('../utils/logger');

const defaultLanguage = process.env['LOCALE'];

// TODO: Move translations to separate files.

i18next
  .init({
    fallbackLng: 'es',
    lng: defaultLanguage,
    debug: false,
    resources: {
      es: {
        translation: {
          patterns: {
            title: 'Patrón anterior',
            description: '¿Qué patrón describió el precio de los nabos la semana pasada?<i>(Esta información afectará a tu patrón)</i>',
            pattern: 'Patrón',
            all: 'Todos los patrones',
            decreasing: 'Decreciente',
            fluctuating: 'Fluctuante',
            unknown: 'No lo sé',
            'large-spike': 'Pico alto',
            'small-spike': 'Pico moderado',
          },
          weekdays: {
            monday: 'Lunes',
            tuesday: 'Martes',
            wednesday: 'Miércoles',
            thursday: 'Jueves',
            friday: 'Viernes',
            saturday: 'Sábado',
            sunday: 'Domingo',
            abr: {
              monday: 'LU',
              tuesday: 'MA',
              wednesday: 'MI',
              thursday: 'JU',
              friday: 'VI',
              saturday: 'SA',
            },
          },
          times: {
            morning: 'AM',
            afternoon: 'PM',
          },
        },
      },
      en: {
        translation: {
          patterns: {
            title: 'Previous Pattern',
            description: "What was last week's turnip price pattern?<i>(This affects your pattern)</i>",
            pattern: 'Pattern',
            all: 'All patterns',
            decreasing: 'Decreasing',
            fluctuating: 'Fluctuating',
            unknown: "I don't know",
            'large-spike': 'Large Spike',
            'small-spike': 'Small Spike',
          },
        },
      },
    },
  })
  .then(t => {
    logger.server(`i18next initialized | Language: ${defaultLanguage}`);
    // TODO: Change this ?
    global.i18next = {
      t,
    };
  });
