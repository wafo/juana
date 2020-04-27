const { CanvasRenderService } = require('chartjs-node-canvas');
const logger = require('../utils/logger');

const canvasRenderService = new CanvasRenderService(1080, 400, ChartJS => {
  ChartJS.plugins.register({
    beforeDraw: chart => {
      const ctx = chart.ctx;
      ctx.save();
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, 1080, 400);
      ctx.restore();
    },
  });
  logger.server('Canvas initialized');
});

async function createChart(prices, possibilities, spikes) {
  const chartLabels = [i18next.t('weekdays.sunday')].concat(
    ...[
      i18next.t('weekdays.abr.monday'),
      i18next.t('weekdays.abr.tuesday'),
      i18next.t('weekdays.abr.wednesday'),
      i18next.t('weekdays.abr.thursday'),
      i18next.t('weekdays.abr.friday'),
      i18next.t('weekdays.abr.saturday'),
    ].map(day => {
      return [i18next.t('times.morning'), i18next.t('times.afternoon')].map(time => `${day} ${time}`);
    }),
  );

  const chartConfiguration = {
    options: {},
    elements: {
      line: {
        backgroundColor: '#0000FF',
        cubicInterpolationMode: 'monotone',
      },
    },
    maintainAspectRatio: false,
    tooltips: {
      intersect: false,
      mode: 'index',
    },
    type: 'line',
    // TEST
    data: {
      datasets: [
        {
          label: 'Precio de entrada',
          data: prices.slice(1),
          fill: false,
          backgroundColor: 'rgba(60,60,60,.50)',
          borderColor: 'rgba(60,60,60,.50)',
          cubicInterpolationMode: 'monotone',
        },
        {
          label: 'Minimo',
          data: possibilities.prices.slice(1).map(day => day.min),
          fill: false,
          backgroundColor: 'rgba(255,0,0,.30)',
          borderColor: 'rgba(255,0,0,.30)',
          cubicInterpolationMode: 'monotone',
        },
        {
          label: 'Máximo',
          data: possibilities.prices.slice(1).map(day => day.max),
          fill: '-1',
          backgroundColor: 'rgba(0,0,255,.30)',
          borderColor: 'rgba(0,0,255,.30)',
          cubicInterpolationMode: 'monotone',
        },
        {
          label: 'Picos',
          data: spikes,
          fill: '-1',
          backgroundColor: 'rgba(0,255,0,.10)',
          borderColor: 'rgba(0,255,0,.10)',
          cubicInterpolationMode: 'monotone',
        },
      ],
      labels: chartLabels,
    },
  };

  const buffer = await canvasRenderService.renderToBufferSync(chartConfiguration, 'image/jpeg');
  return buffer;
}

module.exports = {
  createChart,
};
