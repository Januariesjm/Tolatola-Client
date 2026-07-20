const https = require('https');
const fs = require('fs');
const path = require('path');

// Unique high quality category images mapping with Unsplash URLs
const categoryImages = {
  agriculture: {
    url: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=800&h=1000&fit=crop&q=80',
    filename: 'category-agriculture.jpg'
  },
  handicrafts: {
    url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&h=1000&fit=crop&q=80',
    filename: 'category-handicrafts.jpg'
  },
  'food-beverages': {
    url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=1000&fit=crop&q=80',
    filename: 'category-food-beverages.jpg'
  },
  textiles: {
    url: 'https://images.unsplash.com/photo-1584184924103-e310d9dc82fc?w=800&h=1000&fit=crop&q=80',
    filename: 'category-textiles.jpg'
  },
  electronics: {
    url: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800&h=1000&fit=crop&q=80',
    filename: 'category-electronics.jpg'
  },
  'home-garden': {
    url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&h=1000&fit=crop&q=80',
    filename: 'category-home-garden.jpg'
  },
  'health-beauty': {
    url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=1000&fit=crop&q=80',
    filename: 'category-health-beauty.jpg'
  },
  services: {
    url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=1000&fit=crop&q=80',
    filename: 'category-services.jpg'
  },
  'fast-moving-consumer-goods': {
    url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&h=1000&fit=crop&q=80',
    filename: 'category-fmcg.jpg'
  },
  'construction-hardware': {
    url: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&h=1000&fit=crop&q=80',
    filename: 'category-hardware.jpg'
  },
  vehicles: {
    url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=1000&fit=crop&q=80',
    filename: 'category-vehicles.jpg'
  },
  'vehicles-sub': {
    url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=1000&fit=crop&q=80',
    filename: 'category-vehicles-sub.jpg'
  },
  'ready-to-eat': {
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=1000&fit=crop&q=80',
    filename: 'category-ready-to-eat.jpg'
  },
  'spare-parts': {
    url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&h=1000&fit=crop&q=80',
    filename: 'category-spare-parts.jpg'
  },
  drinks: {
    url: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=800&h=1000&fit=crop&q=80',
    filename: 'category-drinks.jpg'
  },
  'non-alcoholic': {
    url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&h=1000&fit=crop&q=80',
    filename: 'category-non-alcoholic.jpg'
  },
  alcoholic: {
    url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=1000&fit=crop&q=80',
    filename: 'category-alcoholic.jpg'
  },
  motorcycles: {
    url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&h=1000&fit=crop&q=80',
    filename: 'category-motorcycles.jpg'
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
