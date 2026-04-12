import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface PanelProps {
  collapsible?: boolean;
  collapsed?: boolean;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Panel({ collapsible = false, collapsed = false, title, children, className }: PanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  useEffect(() => {
    setIsCollapsed(collapsed);
  }, [collapsed]);

  const handleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  }

  return (
    <div className={`bg-white rounded-lg shadow-md mb-4 ${className}`}>
      {collapsible && (
        <div role="button" onClick={handleCollapse} className="flex items-center justify-between p-2 px-4 cursor-pointer">
          {<h3 className="text-lg font-bold">{title || 'Add Title'}</h3>}
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      )}
      <div className={`${isCollapsed ? 'hidden' : ''} ${collapsible ? 'border-t border-zinc-200' : ''} p-4`}>
        {children}
      </div>
    </div>
  )
}