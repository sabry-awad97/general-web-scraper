import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import {
  Bell,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Code,
  FileText,
  Folder,
  HelpCircle,
  LucideIcon,
  Moon,
  Settings,
  User,
} from "lucide-react";
import { Resizable } from "re-resizable";
import React, { useCallback, useMemo, useState } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "react-beautiful-dnd";
import {
  Mosaic,
  MosaicBranch,
  MosaicNode,
  MosaicWindow,
} from "react-mosaic-component";
import "react-mosaic-component/react-mosaic-component.css";
import { useTheme } from "./hooks/useTheme";

// ViewId type
type ViewId = "project" | "spider" | "job" | "log" | "settings";

// Header component
const Header: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <header className="border-b border-border/40 bg-background/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center justify-between px-4 mx-auto">
        <div className="flex items-center space-x-4">
          <div className="text-xl font-bold">Scrapy Client</div>
          <nav className="hidden space-x-4 md:flex">
            {["Dashboard", "Projects", "Documentation"].map((item) => (
              <Button key={item} variant="ghost" size="sm">
                {item}
              </Button>
            ))}
          </nav>
        </div>
        <div className="flex items-center space-x-3">
          <TooltipProvider>
            {[
              {
                name: "Theme",
                icon: Moon,
                onClick: () => setTheme(theme === "dark" ? "light" : "dark"),
              },
              { name: "Notifications", icon: Bell },
              { name: "Help", icon: HelpCircle },
              { name: "User", icon: User },
            ].map((item) => (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={item.onClick}>
                    <item.icon className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{item.name}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
};

// Sidebar component
interface SidebarProps {
  activeViews: ViewId[];
  toggleView: (viewId: ViewId) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeViews, toggleView }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const views: { id: ViewId; label: string; icon: LucideIcon }[] = [
    { id: "project", label: "Project", icon: Folder },
    { id: "spider", label: "Spider", icon: Code },
    { id: "job", label: "Job", icon: Briefcase },
    { id: "log", label: "Log", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <Resizable
      enable={{ right: true }}
      minWidth={isCollapsed ? 64 : 200}
      maxWidth={300}
      defaultSize={{ width: isCollapsed ? 64 : 200, height: "100%" }}
    >
      <aside
        className={`flex flex-col border-r border-border/40 bg-background ${isCollapsed ? "w-16" : "w-full"}`}
      >
        <div className="p-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-full mb-4"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </Button>
          <nav className="space-y-2">
            {views.map((view, index) => {
              const Icon = view.icon;
              return (
                <Draggable key={view.id} draggableId={view.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <Button
                        variant={
                          activeViews.includes(view.id) ? "default" : "ghost"
                        }
                        className="justify-start w-full"
                        onClick={() => toggleView(view.id)}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        <span className="hidden md:inline">{view.label}</span>
                      </Button>
                    </div>
                  )}
                </Draggable>
              );
            })}
          </nav>
        </div>
      </aside>
    </Resizable>
  );
};

// View components
const ViewWrapper: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="h-full p-6 rounded-lg shadow-lg bg-background/50 backdrop-blur-sm">
    <h2 className="mb-4 text-2xl font-bold">{title}</h2>
    {children}
  </div>
);

const ProjectView: React.FC = () => (
  <ViewWrapper title="Project View">
    <div className="space-y-4">
      <div>
        <Label htmlFor="project-name">Project Name</Label>
        <Input id="project-name" placeholder="Enter project name" />
      </div>
      <div>
        <Label htmlFor="project-description">Description</Label>
        <Input
          id="project-description"
          placeholder="Enter project description"
        />
      </div>
      <Button>Create Project</Button>
    </div>
  </ViewWrapper>
);

const SpiderView: React.FC = () => (
  <ViewWrapper title="Spider View">
    <div className="space-y-4">
      <div>
        <Label htmlFor="spider-name">Spider Name</Label>
        <Input id="spider-name" placeholder="Enter spider name" />
      </div>
      <div>
        <Label htmlFor="start-url">Start URL</Label>
        <Input id="start-url" placeholder="Enter start URL" />
      </div>
      <Button>Create Spider</Button>
    </div>
  </ViewWrapper>
);

const JobView: React.FC = () => (
  <ViewWrapper title="Job View">
    <div className="space-y-4">
      <div>
        <Label htmlFor="job-name">Job Name</Label>
        <Input id="job-name" placeholder="Enter job name" />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Select Spider</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Spider 1</DropdownMenuItem>
          <DropdownMenuItem>Spider 2</DropdownMenuItem>
          <DropdownMenuItem>Spider 3</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button>Start Job</Button>
    </div>
  </ViewWrapper>
);

const LogView: React.FC = () => (
  <ViewWrapper title="Log View">
    <div className="h-64 p-4 overflow-auto rounded-md bg-secondary/20">
      <pre>
        {`[2023-04-15 10:30:15] INFO: Spider 'example_spider' started
[2023-04-15 10:30:16] DEBUG: Crawled (200) <GET http://example.com> (referer: None)
[2023-04-15 10:30:17] INFO: Scraped item: {'title': 'Example Page', 'url': 'http://example.com'}
[2023-04-15 10:30:18] WARNING: Retrying <GET http://example.com/page2> (failed 1 times)
[2023-04-15 10:30:20] INFO: Spider 'example_spider' closed (finished)`}
      </pre>
    </div>
  </ViewWrapper>
);

const SettingsView: React.FC = () => (
  <ViewWrapper title="Settings View">
    <div className="space-y-4">
      <div>
        <Label htmlFor="concurrent-requests">Concurrent Requests</Label>
        <Input id="concurrent-requests" type="number" defaultValue={16} />
      </div>
      <div>
        <Label htmlFor="download-delay">Download Delay (seconds)</Label>
        <Input id="download-delay" type="number" defaultValue={0} step={0.1} />
      </div>
      <div className="flex items-center space-x-2">
        <input type="checkbox" id="respect-robots-txt" className="w-4 h-4" />
        <Label htmlFor="respect-robots-txt">Respect robots.txt</Label>
      </div>
      <Button>Save Settings</Button>
    </div>
  </ViewWrapper>
);

const DragViewsPrompt: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="120"
          height="120"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      </motion.div>
      <motion.h2
        className="mb-4 text-3xl font-bold"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        Your Workspace Awaits
      </motion.h2>
      <motion.p
        className="mb-8 text-xl text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        Drag views from the sidebar to start building your custom layout
      </motion.p>
      <motion.div
        className="flex items-center text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.8 }}
      >
        <ChevronLeft className="w-4 h-4 mr-2" />
        Select views from the sidebar
      </motion.div>
    </div>
  );
};

// Main App component
function App() {
  const [layout, setLayout] = useState<MosaicNode<ViewId> | null>({
    direction: "row",
    first: "project",
    second: {
      direction: "column",
      first: "spider",
      second: "job",
    },
  });

  const [activeViews, setActiveViews] = useState<ViewId[]>([
    "project",
    "spider",
    "job",
  ]);

  const [draggedView, setDraggedView] = useState<ViewId | null>(null);

  const toggleView = useCallback((viewId: ViewId) => {
    setActiveViews((prev) =>
      prev.includes(viewId)
        ? prev.filter((id) => id !== viewId)
        : [...prev, viewId],
    );
    setLayout((prevLayout) =>
      viewExists(prevLayout, viewId)
        ? removePaneFromLayout(prevLayout, viewId)
        : addPaneToLayout(prevLayout, viewId),
    );
  }, []);

  const createLayoutFromActiveViews = useCallback(
    (views: ViewId[]): MosaicNode<ViewId> | null => {
      if (views.length === 0) return null;
      if (views.length === 1) return views[0]!;
      return {
        direction: "row",
        first: views[0]!,
        second: createLayoutFromActiveViews(views.slice(1))!,
      };
    },
    [],
  );

  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;

      if (
        result.source.droppableId === "sidebar" &&
        result.destination.droppableId === "workspace"
      ) {
        const viewId = result.draggableId as ViewId;
        if (!activeViews.includes(viewId)) {
          setActiveViews((prev) => [...prev, viewId]);
          setLayout((prevLayout) => addPaneToLayout(prevLayout, viewId));
        }
      } else if (
        result.source.droppableId === "sidebar" &&
        result.destination.droppableId === "sidebar"
      ) {
        // Handle reordering within the sidebar if needed
        const newActiveViews = Array.from(activeViews);
        const [reorderedItem] = newActiveViews.splice(result.source.index, 1);
        if (reorderedItem && result.destination?.index !== undefined) {
          newActiveViews.splice(result.destination.index, 0, reorderedItem);
          setActiveViews(newActiveViews);
        }
      }
    },
    [activeViews],
  );

  const ELEMENT_MAP: Record<ViewId, React.ReactNode> = useMemo(
    () => ({
      project: <ProjectView />,
      spider: <SpiderView />,
      job: <JobView />,
      log: <LogView />,
      settings: <SettingsView />,
    }),
    [],
  );

  const renderTile = useCallback(
    (id: ViewId | MosaicNode<ViewId>, path: MosaicBranch[]) => {
      const viewId = typeof id === "string" ? id : "Unknown";

      return (
        <MosaicWindow<ViewId>
          path={path}
          title={viewId.charAt(0).toUpperCase() + viewId.slice(1)}
          toolbarControls={[
            <Button
              key="close"
              size="sm"
              variant="ghost"
              onClick={() => toggleView(viewId as ViewId)}
              className="transition-colors hover:bg-primary/10"
            >
              Close
            </Button>,
          ]}
          className="overflow-hidden rounded-lg shadow-lg"
        >
          <div className="flex-1 p-4 overflow-auto bg-background/50 backdrop-blur-sm">
            {ELEMENT_MAP[viewId as ViewId]}
          </div>
        </MosaicWindow>
      );
    },
    [ELEMENT_MAP, toggleView],
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-background to-secondary/30">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="sidebar" direction="vertical">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              <Sidebar activeViews={activeViews} toggleView={toggleView} />
              {provided.placeholder}
            </div>
          )}
        </Droppable>
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <Droppable droppableId="workspace" direction="vertical">
            {(provided) => (
              <main
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex-1 p-4 overflow-hidden"
              >
                <Mosaic<ViewId>
                  renderTile={renderTile}
                  value={layout}
                  onChange={setLayout}
                  className="h-full mosaic-blueprint-theme bp4-dark"
                  zeroStateView={<DragViewsPrompt />}
                />
                {provided.placeholder}
              </main>
            )}
          </Droppable>
        </div>
      </DragDropContext>
    </div>
  );
}

// Helper functions
function addPaneToLayout(
  layout: MosaicNode<ViewId> | null,
  viewId: ViewId,
): MosaicNode<ViewId> {
  if (!layout) return viewId;
  return { direction: "row", first: layout, second: viewId };
}

function removePaneFromLayout(
  layout: MosaicNode<ViewId> | null,
  viewId: ViewId,
): MosaicNode<ViewId> | null {
  if (!layout) return null;
  if (typeof layout === "string") return layout === viewId ? null : layout;
  if (layout.first === viewId) return layout.second;
  if (layout.second === viewId) return layout.first;
  return {
    direction: layout.direction,
    first: removePaneFromLayout(layout.first, viewId)!,
    second: removePaneFromLayout(layout.second, viewId)!,
  };
}

function viewExists(
  layout: MosaicNode<ViewId> | null,
  viewId: ViewId,
): boolean {
  if (!layout) return false;
  if (typeof layout === "string") return layout === viewId;
  return viewExists(layout.first, viewId) || viewExists(layout.second, viewId);
}

export default App;
