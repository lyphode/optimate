import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useLocation, Link } from 'react-router-dom';

interface AppLayoutProps {
  children: React.ReactNode;
}

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/clients': 'Clients',
  '/projects': 'Projects',
  '/inventory/slabs': 'Stock Slabs',
  '/inventory/offcuts': 'Off-Cuts',
  '/optimizer': 'Nesting Optimizer',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  const getBreadcrumbs = () => {
    const breadcrumbs: { label: string; href: string; isLast: boolean }[] = [];
    let currentPath = '';

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      const label = routeTitles[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
      breadcrumbs.push({ label, href: currentPath, isLast });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const pageTitle = routeTitles[location.pathname] || 'Dashboard';

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.href}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {crumb.isLast ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={crumb.href}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
