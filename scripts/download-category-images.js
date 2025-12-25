const https = require('https');
const fs = require('fs');
const path = require('path');

// Category images mapping with Unsplash URLs
const categoryImages = {
  agriculture: {
    url: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=1000&fit=crop&q=80',
    filename: 'category-agriculture.jpg'
  },
  handicrafts: {
    url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=1000&fit=crop&q=80',
    filename: 'category-handicrafts.jpg'
  },
  'food-beverages': {
    url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=1000&fit=crop&q=80',
    filename: 'category-food-beverages.jpg'
  },
  textiles: {
    url: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&h=1000&fit=crop&q=80',
    filename: 'category-textiles.jpg'
  },
  electronics: {
    url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=1000&fit=crop&q=80',
    filename: 'category-electronics.jpg'
  },
  'home-garden': {
    url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=1000&fit=crop&q=80',
    filename: 'category-home-garden.jpg'
  },
  'health-beauty': {
    url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=1000&fit=crop&q=80',
    filename: 'category-health-beauty.jpg'
  },
  services: {
    url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=1000&fit=crop&q=80',
    filename: 'category-services.jpg'
  }
};

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Function to download image
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✓ Downloaded: ${path.basename(filepath)}`);
          resolve();
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirects
        file.close();
        fs.unlinkSync(filepath);
        downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
      } else {
        file.close();
        fs.unlinkSync(filepath);
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      reject(err);
    });
  });
}

// Download all images
async function downloadAllImages() {
  console.log('Starting download of category images...\n');
  
  const downloadPromises = Object.entries(categoryImages).map(async ([key, { url, filename }]) => {
    const filepath = path.join(publicDir, filename);
    try {
      await downloadImage(url, filepath);
    } catch (error) {
      console.error(`✗ Failed to download ${filename}:`, error.message);
    }
  });
  
  await Promise.all(downloadPromises);
  console.log('\n✓ All downloads completed!');
}

// Run the download
downloadAllImages().catch(console.error);

