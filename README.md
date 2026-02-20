# Unar - Natural Solid Perfumes Website

A beautiful, modern website for Unar natural solid perfumes, ready to be hosted on GoDaddy.

## 🌿 About

Unar (உணர்) offers handcrafted solid perfumes made with pure beeswax, natural butters, and essential oils. This website showcases the brand's story, product collections, and provides a way for customers to connect.

## 📁 File Structure

```
unar/
├── index.html              # Main website file
├── styles.css              # All styling and responsive design
├── script.js               # Interactive functionality
├── assets/                 # Images and logos
│   ├── Copy of Unar (1 x 2 in).svg
│   ├── Designer.png
│   ├── HANDCRAFTED and HANDPOURED - 100% natural - SKIN FRIENDLY.svg
│   └── butterfly.png
└── README.md              # This file
```

## 🚀 How to Host on GoDaddy

### Method 1: Using File Manager (Recommended for Beginners)

1. **Log into GoDaddy:**
   - Go to [godaddy.com](https://www.godaddy.com) and sign in
   - Navigate to "My Products"

2. **Access Web Hosting:**
   - Find your hosting plan
   - Click "Manage" next to your hosting account

3. **Open File Manager:**
   - In the hosting control panel (cPanel), find "File Manager"
   - Navigate to the `public_html` folder

4. **Upload Files:**
   - Delete any existing `index.html` or default files in `public_html`
   - Upload ALL files maintaining the structure:
     - `index.html` (root of public_html)
     - `styles.css` (root of public_html)
     - `script.js` (root of public_html)
     - `assets/` folder with all images

5. **Set Permissions:**
   - Right-click on files and set permissions to 644
   - Set folder permissions to 755

6. **Test Your Website:**
   - Visit your domain (e.g., www.unar.in)
   - The website should load immediately

### Method 2: Using FTP (Advanced)

1. **Get FTP Credentials:**
   - In GoDaddy cPanel, find "FTP Accounts"
   - Note your FTP hostname, username, and password

2. **Use an FTP Client:**
   - Download FileZilla (free) or use any FTP client
   - Connect using your credentials

3. **Upload Files:**
   - Navigate to `public_html` on the remote server
   - Upload all files maintaining the folder structure

### Method 3: Using cPanel File Upload

1. In cPanel, go to "File Manager"
2. Navigate to `public_html`
3. Click "Upload" button
4. Select all files and upload
5. Use "Extract" for any zip files

## ✨ Features

- **Responsive Design:** Works perfectly on desktop, tablet, and mobile
- **Modern UI/UX:** Clean, elegant design with smooth animations
- **SEO Optimized:** Proper meta tags and semantic HTML
- **Fast Loading:** Optimized images and minimal external dependencies
- **Contact Form:** Email integration for customer inquiries
- **Professional Typography:** Google Fonts (Cormorant Garamond & Inter)

## 🎨 Design Highlights

- **Color Palette:**
  - Primary: Natural green (#5a7c65)
  - Secondary: Warm gold (#d4a574)
  - Accent: Cream beige (#e8d5c4)

- **Sections:**
  - Hero with compelling tagline
  - About/Story section
  - Features showcase
  - 8 Product collections
  - Contact form with details

## 📱 Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🔧 Customization

### To Update Content:
Edit `index.html` and modify the text within the HTML tags.

### To Change Colors:
Edit `styles.css` and update the CSS variables at the top:
```css
:root {
    --primary-color: #5a7c65;
    --secondary-color: #d4a574;
    /* etc. */
}
```

### To Add/Remove Collections:
Edit the collections section in `index.html` and add/remove `.collection-card` divs.

## 📞 Contact Information

- **Website:** www.unar.in
- **Email:** unar.consciousliving@gmail.com
- **Phone:** +91 9600522437

## 📝 Notes

- All images are optimized for web
- The contact form uses `mailto:` links (opens user's email client)
- No database or backend required - fully static website
- Can be hosted on any web hosting service (not just GoDaddy)

## 🌐 Domain Setup

If you haven't connected your domain yet:

1. In GoDaddy, go to "My Products"
2. Find "Domains" and click "Manage All"
3. Find your domain (unar.in) and click "DNS"
4. Ensure A record points to your hosting IP
5. Wait 24-48 hours for DNS propagation

## 🎯 Future Enhancements (Optional)

- Add e-commerce functionality for direct purchases
- Integrate with payment gateway
- Add product image gallery
- Implement proper contact form backend
- Add newsletter signup
- Integrate analytics (Google Analytics)

## 📄 License

Copyright © 2024 Unar. All rights reserved.

---

**Built with ❤️ for conscious living**
