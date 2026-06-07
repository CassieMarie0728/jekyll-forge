# Jekyll Forge Landing Page - Deployment Guide

Complete step-by-step instructions for deploying the Jekyll Forge landing page to GitHub Pages or other platforms.

## Table of Contents

1. [GitHub Pages (Recommended)](#github-pages-recommended)
2. [Custom Domain Setup](#custom-domain-setup)
3. [Alternative Platforms](#alternative-platforms)
4. [Troubleshooting](#troubleshooting)
5. [Post-Deployment Checklist](#post-deployment-checklist)

---

## GitHub Pages (Recommended)

GitHub Pages is the easiest way to deploy this landing page. It's free, fast, and integrates seamlessly with GitHub.

### Step 1: Create a GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. **Repository name**: `jekyll-forge-landing` (or your preferred name)
3. **Description**: "Landing page for Jekyll Forge - Visual CMS for Jekyll blogs"
4. **Visibility**: Public (required for GitHub Pages)
5. **Initialize with**: Leave unchecked
6. Click **Create repository**

### Step 2: Push Your Code

```bash
# Navigate to the landing page directory
cd jekyll-forge-landing

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Jekyll Forge landing page"

# Rename branch to main (if needed)
git branch -M main

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/jekyll-forge-landing.git

# Push to GitHub
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** (gear icon at the top right)
3. In the left sidebar, click **Pages**
4. Under "Build and deployment":
   - **Source**: Select "Deploy from a branch"
   - **Branch**: Select `main`
   - **Folder**: Select `/ (root)`
5. Click **Save**

GitHub will now build and deploy your site. This typically takes 1-2 minutes.

### Step 4: Access Your Site

Your landing page will be available at:
```
https://YOUR_USERNAME.github.io/jekyll-forge-landing
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Custom Domain Setup

To use a custom domain (e.g., `jekyllforge.dev`), follow these steps:

### Option A: Using a Subdomain (CNAME)

**Best for**: Subdomains like `landing.jekyllforge.dev`

1. **In GitHub**:
   - Go to repository **Settings** → **Pages**
   - Under "Custom domain", enter: `landing.jekyllforge.dev`
   - Check "Enforce HTTPS"
   - Click **Save**

2. **At Your Domain Registrar** (GoDaddy, Namecheap, etc.):
   - Go to DNS settings
   - Create a new CNAME record:
     - **Name**: `landing`
     - **Value**: `YOUR_USERNAME.github.io`
   - Save changes

3. **Wait for DNS Propagation**:
   - DNS changes can take 24 hours to propagate
   - Check status: `nslookup landing.jekyllforge.dev`

### Option B: Using an Apex Domain (A Records)

**Best for**: Root domains like `jekyllforge.dev`

1. **In GitHub**:
   - Go to repository **Settings** → **Pages**
   - Under "Custom domain", enter: `jekyllforge.dev`
   - Check "Enforce HTTPS"
   - Click **Save**

2. **At Your Domain Registrar**:
   - Go to DNS settings
   - Create A records pointing to GitHub Pages:
     ```
     A record: 185.199.108.153
     A record: 185.199.109.153
     A record: 185.199.110.153
     A record: 185.199.111.153
     ```
   - Remove any existing A records for the domain
   - Save changes

3. **Optional: Add www subdomain**:
   - Create a CNAME record:
     - **Name**: `www`
     - **Value**: `jekyllforge.dev`

4. **Wait for DNS Propagation**:
   - DNS changes can take 24-48 hours
   - Check status: `nslookup jekyllforge.dev`

### Verify Custom Domain

Once DNS propagates, verify your setup:

```bash
# Check DNS resolution
nslookup jekyllforge.dev

# Check if GitHub Pages is serving your site
curl -I https://jekyllforge.dev
```

---

## Alternative Platforms

### Netlify

1. **Connect GitHub**:
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Select GitHub and authorize
   - Choose your `jekyll-forge-landing` repository

2. **Configure Build**:
   - **Build command**: Leave empty (static site)
   - **Publish directory**: `.` (root)
   - Click **Deploy**

3. **Custom Domain**:
   - Go to Site settings → Domain management
   - Click "Add custom domain"
   - Follow Netlify's DNS instructions

### Vercel

1. **Import Project**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure**:
   - **Framework**: Other
   - **Build Command**: Leave empty
   - Click **Deploy**

3. **Custom Domain**:
   - Go to Project Settings → Domains
   - Add your custom domain
   - Follow Vercel's DNS instructions

### AWS S3 + CloudFront

1. **Create S3 Bucket**:
   ```bash
   aws s3 mb s3://jekyllforge-landing
   ```

2. **Upload Files**:
   ```bash
   aws s3 sync . s3://jekyllforge-landing --exclude ".git*"
   ```

3. **Enable Static Website Hosting**:
   - Go to S3 bucket → Properties
   - Enable "Static website hosting"
   - Index document: `index.html`
   - Error document: `index.html`

4. **Set Bucket Policy**:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::jekyllforge-landing/*"
       }
     ]
   }
   ```

5. **Create CloudFront Distribution**:
   - Origin: Your S3 bucket
   - Enable HTTPS
   - Add custom domain in Alternate domain names

---

## Troubleshooting

### Site Not Appearing

**Problem**: GitHub Pages shows 404 error

**Solutions**:
1. Verify repository is public
2. Check that `index.html` is in the root directory
3. Wait 2-3 minutes for GitHub to build
4. Check the Actions tab for build errors:
   - Go to repository → Actions
   - Look for failed workflows
   - Click to see error details

### DNS Not Resolving

**Problem**: Custom domain shows "This domain is not available"

**Solutions**:
1. Verify DNS records are correct:
   ```bash
   nslookup jekyllforge.dev
   ```
2. Wait for DNS propagation (up to 48 hours)
3. Clear browser cache and try again
4. Try from a different network/device

### HTTPS Not Working

**Problem**: Site shows "Not Secure" or SSL certificate error

**Solutions**:
1. Ensure "Enforce HTTPS" is checked in GitHub Pages settings
2. Wait 5-10 minutes for certificate generation
3. Clear browser cache
4. Try in an incognito/private window

### Images Not Loading

**Problem**: Images show broken image icons

**Solutions**:
1. Verify image URLs are absolute (start with `https://`)
2. Check that CDN URLs are accessible:
   ```bash
   curl -I https://d2xsxph8kpxj0f.cloudfront.net/...
   ```
3. If using local images, ensure they're in the repository
4. Check browser console for 404 errors (F12 → Console)

### Styles Not Applied

**Problem**: Page looks unstyled or broken

**Solutions**:
1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Check that `styles.css` is in root directory
4. Verify CSS file permissions are readable
5. Check browser console for CSS loading errors

---

## Post-Deployment Checklist

After deploying, verify everything works:

- [ ] Site loads without errors
- [ ] All images display correctly
- [ ] Links work (especially CTA buttons)
- [ ] Navigation links scroll to correct sections
- [ ] Mobile responsive on phone/tablet
- [ ] Forms/buttons are clickable
- [ ] No console errors (F12 → Console)
- [ ] Page loads in <3 seconds
- [ ] Custom domain resolves (if using one)
- [ ] HTTPS is enabled and working
- [ ] Social media preview looks good
- [ ] Analytics tracking is configured (if needed)

### Test Checklist Commands

```bash
# Test page load time
curl -w "@curl-format.txt" -o /dev/null -s https://jekyllforge.dev

# Check for broken links
wget --spider -r https://jekyllforge.dev

# Test mobile responsiveness
# Use Chrome DevTools → Toggle device toolbar (Ctrl+Shift+M)

# Test accessibility
# Use axe DevTools browser extension
```

---

## Updating Your Landing Page

To make changes after deployment:

1. **Make changes locally**:
   ```bash
   # Edit files
   vim index.html
   ```

2. **Test locally**:
   ```bash
   # Serve locally
   python3 -m http.server 8000
   # Visit http://localhost:8000
   ```

3. **Push changes**:
   ```bash
   git add .
   git commit -m "Update landing page content"
   git push origin main
   ```

4. **GitHub Pages will automatically rebuild** (1-2 minutes)

---

## Performance Optimization

### Reduce Page Load Time

1. **Compress Images**:
   ```bash
   # Using ImageOptim or similar tool
   # Ensure images are < 500KB each
   ```

2. **Minify CSS** (optional):
   ```bash
   # Use CSS minifier
   # Replace styles.css with minified version
   ```

3. **Enable Caching**:
   - GitHub Pages automatically caches static assets
   - Add cache headers via CloudFront if using AWS

### Monitor Performance

- Use [Google PageSpeed Insights](https://pagespeed.web.dev)
- Check [GTmetrix](https://gtmetrix.com)
- Monitor with [WebPageTest](https://www.webpagetest.org)

---

## Analytics & Monitoring

### Add Google Analytics

1. Get your Google Analytics ID
2. Add to `index.html` before `</head>`:
   ```html
   <!-- Google Analytics -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'GA_MEASUREMENT_ID');
   </script>
   ```

### Monitor Uptime

Use services like:
- [UptimeRobot](https://uptimerobot.com) (free)
- [Pingdom](https://www.pingdom.com)
- [StatusCake](https://www.statuscake.com)

---

## Support & Help

- **GitHub Pages Docs**: https://docs.github.com/en/pages
- **Jekyll Documentation**: https://jekyllrb.com/docs/
- **DNS Help**: https://www.cloudflare.com/learning/dns/
- **Jekyll Forge Support**: https://jekyllforge.dev/support

---

**Happy deploying! 🚀**
