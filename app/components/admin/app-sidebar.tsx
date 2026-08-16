import * as React from "react";
import { NavLink, useLocation } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Activity01Icon,
  BookOpen01Icon,
  FileChartColumnIncreasingIcon,
  ClipboardCheckIcon,
  ClipboardListIcon,
  CreditCardIcon,
  Folder01Icon,
  Upload01Icon,
  Mortarboard01Icon,
  DashboardSquare01Icon,
  Settings01Icon,
  Shield01Icon,
  UserGroupIcon,
  CreditCardAcceptIcon,
} from "@hugeicons/core-free-icons";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

type NavItem = {
  title: string;
  url: string;
  icon: typeof DashboardSquare01Icon;
  end?: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const data: { navMain: NavGroup[] } = {
  navMain: [
    {
      title: "Overview",
      items: [
        {
          title: "Dashboard",
          url: "/admin",
          icon: DashboardSquare01Icon,
          end: true,
        },
      ],
    },
    {
      title: "Content",
      items: [
        {
          title: "Subjects",
          url: "/admin/subjects",
          icon: BookOpen01Icon,
        },
        {
          title: "Questions",
          url: "/admin/questions",
          icon: ClipboardListIcon,
        },
        {
          title: "Question Sets",
          url: "/admin/question-sets",
          icon: Folder01Icon,
        },
        {
          title: "Imports",
          url: "/admin/imports",
          icon: Upload01Icon,
        },
      ],
    },
    {
      title: "Assessments",
      items: [
        {
          title: "Exams",
          url: "/admin/exams",
          icon: Mortarboard01Icon,
        },
        {
          title: "Mock Exams",
          url: "/admin/mock-exams",
          icon: ClipboardCheckIcon,
        },
        {
          title: "Results",
          url: "/admin/results",
          icon: FileChartColumnIncreasingIcon,
        },
      ],
    },
    {
      title: "Users & Access",
      items: [
        {
          title: "Users",
          url: "/admin/users",
          icon: UserGroupIcon,
        },
        {
          title: "Roles & Permissions",
          url: "/admin/roles",
          icon: Shield01Icon,
        },
      ],
    },
    {
      title: "Business",
      items: [
        {
          title: "Subscriptions",
          url: "/admin/subscriptions",
          icon: CreditCardIcon,
        },
        {
          title: "Payments",
          url: "/admin/payments",
          icon: CreditCardAcceptIcon,
        },
      ],
    },
    {
      title: "System",
      items: [
        {
          title: "Settings",
          url: "/admin/settings",
          icon: Settings01Icon,
        },
        {
          title: "Admin Activity",
          url: "/admin/activity",
          icon: Activity01Icon,
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="DrPass Admin"
              render={<NavLink to="/admin" />}
            >
              <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <HugeiconsIcon icon={Mortarboard01Icon} className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">DrPass</span>
                <span className="text-muted-foreground truncate text-xs">
                  Admin Console
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {data.navMain.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = item.end
                    ? location.pathname === item.url
                    : location.pathname.startsWith(item.url);

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={isActive}
                        render={<NavLink to={item.url} end={item.end} />}
                      >
                        <HugeiconsIcon icon={item.icon} />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Admin Account">
              <HugeiconsIcon icon={UserGroupIcon} />
              <span>Admin Account</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
