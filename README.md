# Crypto Investment Dashboard

A modern, responsive dashboard for tracking cryptocurrency investments with real-time data visualization.

## Features

- Portfolio overview with key metrics
- Interactive charts for portfolio performance and asset allocation
- Detailed holdings table
- Market overview of top cryptocurrencies
- Responsive design that works on all devices

## Deployment to Netlify

1. Sign up for a free account at [Netlify](https://netlify.com)
2. Install the Netlify CLI: `npm install -g netlify-cli`
3. Login to your Netlify account: `netlify login`
4. Navigate to this project directory in your terminal
5. Deploy the site: `netlify deploy`
6. Follow the prompts to select your team and site name
7. When asked for the publish directory, enter: `.` (current directory)
8. After deployment, you'll receive a draft URL. To deploy to production, run: `netlify deploy --prod`

Alternatively, you can deploy by:
1. Going to [Netlify](https://netlify.com) and logging in
2. Clicking "New site from Git" or dragging and dropping the project folder to the deployment area
3. Following the prompts to complete the deployment

## Technologies Used

- HTML5
- CSS3 (with modern flexbox and grid layouts)
- JavaScript (ES6+)
- Chart.js for data visualization

## Customization

To customize the dashboard with your own data:
1. Edit the `script.js` file
2. Modify the `portfolioData` object with your cryptocurrency holdings and market data
3. Redeploy to Netlify to see your changes live

## Browser Support

The dashboard works on all modern browsers including:
- Chrome
- Firefox
- Safari
- Edge

## License

This project is open source and available under the MIT License.