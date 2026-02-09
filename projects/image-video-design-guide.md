# Image & Video Capabilities - OpenClaw
**How to create images, videos, and designs**

---

## 🖼️ IMAGE GENERATION

### Available Options:

#### 1. **Google Anti-Gravity (Gemini Image)**
- **Model:** `gemini-2.5-flash-thinking` or `gemini-3-pro-image`
- **Provider:** google-antigravity (OAuth connected)
- **Status:** ✅ AUTHENTICATED
- **OAuth:** google-antigravity:karandeepsinghsethi3@gmail.com
- **Usage:** `gemini-2.5-flash-thinking 100% left`, `gemini-2.5-pro 100% left`

**Usage:**
```
Create an image of [description] using Google Gemini
Style: [modern, minimalist, etc.]
Colors: [color palette]
Resolution: [1080p, 4K, etc.]
```

#### 2. **Vision Models (Multi-modal)**
Available models with vision capabilities:
- `zai/glm-4.5v` - GLM 4.5 Vision (63K context)
- `zai/glm-4.6v` - GLM 4.6 Vision (125K context)
- `xai/grok-vision-beta` - Grok Vision Beta (8K context)

**Usage:**
- Generate images from descriptions
- Analyze existing images
- Create visual content

---

## 🎥 VIDEO CAPABILITIES

### Available Skill:
**🎞️ video-frames**
- Extract frames from videos using ffmpeg
- Create short clips
- Analyze video content

**To Enable:**
```bash
npx clawhub install video-frames
```

**Usage:**
```
Extract frames from video [path]
Create clip from video [path] [start] [duration]
```

---

## 🎨 DESIGN CAPABILITIES

### 1. **HTML/CSS Design** ✅ CURRENTLY WORKING
Can create:
- Responsive web designs
- UI components
- Color schemes
- Typography systems
- Layout designs

**Example:**
```
Create a landing page design with:
- Hero section with product showcase
- Benefits grid
- Testimonials carousel
- Pricing table
- Contact form
- Modern Forest Green + Gold theme
```

### 2. **SVG Graphics** ✅ CURRENTLY WORKING
Can create:
- Logos
- Icons
- Illustrations
- Diagrams
- Charts

**Example:**
```
Create an SVG logo for One4Health with:
- Leaf icon design
- Forest Green (#2E7D32)
- Gold accent (#C9A227)
- Clean, modern style
```

### 3. **Label/Packaging Design** ✅ CURRENTLY WORKING
Can create:
- Product labels
- Packaging designs
- SVG export

**Files Created:**
- `one4health-packaging-front.svg` ✅

---

## 🚀 SETTING UP IMAGE GENERATION

### Step 1: Check Available Models
```bash
openclaw models list --all
```

### Step 2: Use Google Anti-Gravity for Images
```
Request: "Create a modern product image for Ashwagandha gummy bottle with:
- Bottle design: Cylindrical, premium tube
- Colors: Forest Green label, Gold accent
- Style: Clean, professional, trustworthy
- Background: Soft gradient
- Resolution: 1080x1080 px"
```

### Step 3: Use Vision Models for Analysis
```
Switch to zai/glm-4.6v for image analysis tasks
```

---

## 📱 PROPOSED IMAGE GENERATION WORKFLOW

### For One4Health:

1. **Product Images**
   - Bottle shots with gummies
   - Ingredient visualization
   - Benefit illustrations
   - Before/after graphics

2. **Marketing Materials**
   - Social media graphics
   - Ad banners
   - Email headers
   - Product comparison charts

3. **Design Elements**
   - Icons (stress relief, energy, sleep)
   - Logos variants
   - Color palette visualizations
   - Typography examples

4. **Packaging**
   - Front label
   - Back label
   - Side panels
   - Box design

---

## ✨ GETTING STARTED RIGHT NOW

### Test Image Generation:
```
Create a product image for One4Health Ashwagandha Gummies with:
- Premium gummy bottle with white pills
- Forest Green (#2E7D32) label design
- Gold (#C9A227) accent stripe
- Brand name "One4Health" prominent
- Clean, modern style on gradient background
- 1080x1080 resolution
```

### Test Video Frame Extraction:
```bash
# Install skill (if not installed)
npx clawhub install video-frames

# Extract frames
video-frames extract --video path/to/video.mp4 --output frames/
```

---

## 📊 CURRENT STATUS

| Capability | Status | Tool |
|------------|--------|------|
| **HTML/CSS Design** | ✅ Working | Direct coding |
| **SVG Graphics** | ✅ Working | Direct coding |
| **Label Design** | ✅ Working | SVG export |
| **Image Gen** | ⏳ Available | Google Anti-Gravity |
| **Video Frames** | ❓ Available | video-frames skill |
| **Video Creation** | ❌ Not Available | Need solution |

---

## 🎯 NEXT STEPS

1. **Test Google Anti-Gravity** - Generate sample product image
2. **Install video-frames skill** - Test video capabilities
3. **Create design templates** - Build reusable components
4. **Build image prompt enhancer** - Improve description quality

---

*Document created: 2026-02-05*