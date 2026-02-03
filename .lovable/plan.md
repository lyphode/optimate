
# StoneNest - Stone Slab Cutting Optimizer

A comprehensive stone fabrication management system with intelligent nesting optimization, inventory control, and client project management.

---

## Phase 1: Foundation & Database Structure

### Database Setup (Supabase)
- **Stock Slabs Table**: Stone Type, Stone Name, Primary/Secondary Color, Unique ID (auto-generated), Width, Length, Height, Quantity, Cost, Charge
- **Off-Cuts Table**: Same fields as slabs, plus Parent Slab ID reference
- **Clients Table**: Client Name, Contact Name, Address, Email, Phone
- **Projects Table**: Project Name, Client ID, Room/Location, Status, Created Date
- **Parts Table**: Project ID, Name, Width, Length, Shape Type (rectangle/L-shape/circle/arc), Cutout Details (JSON), Edge Profiles, Locked Status, Assigned Slab Number
- **Users & Roles**: User accounts with Admin, Manager, Operator roles

### Authentication & Access Control
- User login/registration
- Role-based permissions (Admins can manage stock, Operators can only create cuts)
- User assignment to projects

---

## Phase 2: Core Workflow Interface

### Industrial/Workshop UI Design
- Dark theme with amber/orange accent colors
- High contrast for workshop visibility
- Large touch-friendly controls
- Clear data tables and status indicators

### Client Management
- Client list view with search and filters
- Create/edit client forms
- Client history and project overview

### Project Management
- Project dashboard per client
- Create new project or continue existing
- Project status tracking (Draft → In Progress → Completed)
- Room/area organization within projects

---

## Phase 3: Inventory Management

### Slab Stock Control
- Visual slab inventory grid with color swatches
- Quick search by name, color, or type
- Stock level indicators and low-stock alerts
- Add new slabs with full details
- Cost and charge price tracking
- Unit switching (metric/imperial) throughout

### Off-Cut Management
- Separate off-cut inventory
- Link to parent slab for traceability
- Visual off-cut library with dimensions
- Easy selection for smaller parts

---

## Phase 4: Part Entry & Configuration

### Part Designer
- Part entry form with dimensions
- Shape type selector:
  - **Rectangles**: Simple width × length
  - **L-Shapes**: Define the L dimensions
  - **Internal Cutouts**: Draw sink/hob cutouts on rectangular base
  - **Circles & Arcs**: Radius and arc angle inputs
- Visual preview of each part shape
- Edge profile assignment per edge (bullnose, bevel, eased, polished, raw)

### Part List Management
- Drag-to-reorder parts
- Duplicate, edit, delete parts
- Assign parts to specific slabs manually (pre-optimization)
- Part grouping by room/area

### Settings Panel
- Configurable blade kerf width per job
- Unit preference (mm / inches)
- Default edge profile settings

---

## Phase 5: Interactive Nesting & Optimization

### Optimization Engine
- Advanced bin-packing algorithm for rectangles
- Support for irregular shapes (L-shapes, circles)
- Respect kerf width between parts
- Allow/disallow rotation per part (for veined materials)
- Minimize waste percentage

### Visual Slab Layout
- Canvas-based slab visualization
- Multiple slabs numbered (Slab 1, Slab 2, etc.)
- Color-coded parts with labels
- Waste areas highlighted
- Zoom and pan controls

### Interactive Features
- **Lock/Unlock Parts**: Click to lock a part in position (indicated by lock icon)
- **Drag-and-Drop**: Unlocked parts can be manually repositioned
- **Real-time Re-optimization**: As you drag a part, other unlocked parts automatically reposition around it
- Collision detection (parts can't overlap)
- Re-run optimization button (respects locked parts)

---

## Phase 6: Outputs & Reporting

### Printable Cutting Layouts
- PDF generation of each slab layout
- Part labels, dimensions, and edge profile notations
- Cutting sequence suggestions
- Multiple format options (A4, A3, Letter)

### Customer Quotes
- Quote builder from project parts
- Material costs + labor estimation
- Edge profile pricing
- Professional quote PDF/print output
- Email quote to client

### Inventory Reports
- Stock level report
- Usage history by stone type
- Waste percentage analytics
- Off-cut utilization tracking
- Cost/revenue summaries

---

## Design Language

- **Color Palette**: Dark charcoal backgrounds (#1a1a1a), amber accents (#f59e0b), high-contrast whites
- **Typography**: Industrial sans-serif fonts (clean, readable in workshop)
- **UI Elements**: Bold buttons, clear status badges, data-heavy tables with sorting
- **Icons**: Simple line icons for tools, materials, and actions

---

## Technical Notes

- **Backend**: Supabase (Lovable Cloud) for database, auth, and storage
- **Optimization Algorithm**: Custom bin-packing with support for irregular shapes, implemented as an edge function for performance
- **Canvas Rendering**: Interactive slab visualization using HTML Canvas or similar for drag-and-drop
- **File Storage**: Slab images and generated PDFs stored in Supabase Storage

