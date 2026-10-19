import type { LucideIcon } from 'lucide-react';

import { toast } from 'sonner';
import { useRef, useState, useEffect } from 'react';
import {
  Bell,
  Send,
  Users,
  House,
  Clock,
  Wrench,
  Receipt,
  UserRound,
  Building2,
  PanelLeft,
  Briefcase,
  ListChecks,
  FileSearch,
  ChevronRight,
  ArrowRightLeft,
  LayoutDashboard,
} from 'lucide-react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

// ----------------------------------------------------------------------
// Sidebar do Cockpit — adaptada do novo-chassi-v1
// (BHubAI/prototype-cockpit-evolucoes). Só "Painéis" navega de verdade; os
// outros itens são decorativos neste protótipo.
// ----------------------------------------------------------------------

const WIDTH = 236;
const WIDTH_COLLAPSED = 64;
const SLIDE_MS = 200;

const FONT = { fontFamily: '"Lato", sans-serif' };

type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  children?: NavItem[];
};

const NAV_GROUPS: { id: string; label?: string; items: NavItem[] }[] = [
  {
    id: 'inicio',
    items: [{ id: 'home', label: 'Início', icon: House }],
  },
  {
    id: 'trabalho',
    items: [
      { id: 'tasks', label: 'Tarefas', icon: ListChecks },
      { id: 'dispatcher', label: 'Solicitações', icon: Send },
    ],
  },
  {
    id: 'carteira',
    items: [
      { id: 'clients', label: 'Clientes', icon: Users },
      { id: 'portfolio', label: 'Minha carteira', icon: Briefcase },
      { id: 'team', label: 'Meu time', icon: UserRound },
      { id: 'paineis', label: 'Painéis', icon: LayoutDashboard, href: paths.proposta.root },
    ],
  },
  {
    id: 'ferramentas',
    items: [
      {
        id: 'tools',
        label: 'Ferramentas',
        icon: Wrench,
        children: [
          { id: 'scheduler', label: 'Agendar pagamentos', icon: Clock },
          { id: 'extracts', label: 'Buscador de Extratos', icon: FileSearch },
          { id: 'reconciler', label: 'Conciliador', icon: ArrowRightLeft },
          { id: 'invoice-integrator', label: 'Integrador de notas fiscais', icon: Receipt },
        ],
      },
    ],
  },
  {
    id: 'favoritos',
    label: 'Clientes favoritos',
    items: [
      { id: 'fav-1', label: 'Metalúrgica Força Total', icon: Building2 },
      { id: 'fav-2', label: 'Auto Peças Rota Sul', icon: Building2 },
      { id: 'fav-3', label: 'Padaria Vila Nova', icon: Building2 },
    ],
  },
];

const ACTIVE_ID = 'paineis';

function avisoDecorativo(label: string) {
  toast.info(`"${label}" é decorativo neste protótipo — só Painéis navega.`);
}

// ----------------------------------------------------------------------

const BHubLogo = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 31"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="BHub"
    className="block shrink-0"
  >
    <path
      d="M27.7557 0H3.26521C2.36377 0 1.54818.366052.955809.955166.366298 1.54714 0 2.36218 0 3.26301V27.737C0 28.6378.366298 29.4529.955809 30.0448 1.54532 30.6368 2.36377 31 3.26521 31H27.7557C28.6571 31 29.4727 30.6339 30.0651 30.0448 30.6574 29.4557 31.0209 28.6378 31.0209 27.737V3.26301C31.0209 2.36218 30.6546 1.54714 30.0651.955166 29.4756.366052 28.6571 0 27.7557 0ZM9.04871 23.3787C8.7282 23.699 8.30753 23.8591 7.88686 23.8591 7.46619 23.8591 7.04552 23.699 6.72501 23.3787L4.80194 21.4569 2.87888 19.5351C2.55836 19.2149 2.39811 18.7945 2.39811 18.3712 2.39811 17.948 2.55836 17.5304 2.87888 17.2101L5.38287 14.7078 7.88686 12.2055 10.9718 15.2884 14.0567 18.3712 11.5527 20.8735 9.04871 23.3758V23.3787ZM9.30626 10.8185L11.7902 8.33625 14.2742 5.85397C14.6061 5.52223 15.0411 5.35637 15.479 5.35637 15.9168 5.35637 16.3489 5.52223 16.6837 5.85397L19.1677 8.33625 21.6517 10.8185 18.5667 13.9014 15.4818 16.9842 12.3969 13.9014 9.31199 10.8185H9.30626ZM28.0819 19.4722L26.093 21.4598 24.1041 23.4473C23.8008 23.7505 23.403 23.902 23.0052 23.902 22.6075 23.902 22.2097 23.7505 21.9064 23.4473L19.368 20.9107 16.8297 18.3741 19.9146 15.2912 22.9995 12.2084 25.5379 14.745 28.0762 17.2816C28.3795 17.5848 28.5312 17.9823 28.5312 18.3798 28.5312 18.7773 28.3795 19.1748 28.0762 19.478L28.0819 19.4722Z"
      fill="currentColor"
    />
  </svg>
);

type LabelProps = {
  children: string;
  shrunk: boolean;
  visible: boolean;
};

/** Rótulo com o fade da barra original: some antes de encolher, volta depois de abrir. */
const Label = ({ children, shrunk, visible }: LabelProps) => (
  <span
    className={`line-clamp-2 overflow-hidden text-left text-[14px] leading-5 transition-opacity duration-200 ease-out ${
      shrunk ? 'flex-[0_0_0px] whitespace-nowrap' : 'flex-1'
    } ${visible ? 'opacity-100' : 'whitespace-nowrap opacity-0'}`}
  >
    {children}
  </span>
);

type ItemButtonProps = {
  item: NavItem;
  collapsed: boolean;
  labelsVisible: boolean;
  isSub?: boolean;
  onClick?: () => void;
  expanded?: boolean;
};

const ItemButton = ({ item, collapsed, labelsVisible, isSub = false, onClick, expanded }: ItemButtonProps) => {
  const { label, icon: Icon } = item;
  const active = item.id === ACTIVE_ID;

  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed && !isSub ? label : undefined}
      aria-current={active ? 'page' : undefined}
      aria-expanded={item.children ? expanded : undefined}
      className={`group relative flex w-full items-start gap-2 rounded-lg px-[10px] py-2 transition-colors duration-150 ease-out ${
        isSub ? 'min-h-7' : 'min-h-8'
      } ${
        active || expanded
          ? 'bg-white/[0.07] text-[#F9F9F9]'
          : 'text-[#A6A6A6] hover:bg-white/[0.07] hover:text-[#F9F9F9]'
      }`}
    >
      <span className="mt-[2px] inline-flex shrink-0 transition-transform duration-200 ease-out group-hover:-rotate-6 group-hover:scale-110">
        <Icon size={16} />
      </span>
      <Label shrunk={collapsed && !isSub} visible={labelsVisible || isSub}>
        {label}
      </Label>
      {item.children && !collapsed && (
        <ChevronRight
          size={16}
          className={`mt-[2px] shrink-0 text-[#69727D] transition-all duration-200 ease-out ${
            expanded ? 'rotate-90' : ''
          } ${labelsVisible ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </button>
  );
};

const Submenu = ({ item, collapsed, labelsVisible }: { item: NavItem; collapsed: boolean; labelsVisible: boolean }) => {
  const [open, setOpen] = useState(false);
  const isOpen = open && !collapsed;

  return (
    <>
      <ItemButton
        item={item}
        collapsed={collapsed}
        labelsVisible={labelsVisible}
        onClick={() => setOpen((current) => !current)}
        expanded={isOpen}
      />
      {!collapsed && (
        <div
          className={`grid transition-[grid-template-rows] duration-200 ease-out ${
            isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <ul
            className={`mt-1 ml-[14px] flex min-h-0 flex-col gap-1 overflow-hidden border-l border-white/[0.08] pl-[10px] transition-opacity duration-200 ease-out ${
              labelsVisible && isOpen ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {item.children?.map((child) => (
              <li key={child.id}>
                <ItemButton
                  item={child}
                  collapsed={collapsed}
                  labelsVisible={labelsVisible}
                  isSub
                  onClick={() => avisoDecorativo(child.label)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

// ----------------------------------------------------------------------

export function CockpitSidebar() {
  const router = useRouter();
  // `target` é a intenção; `collapsed` vira verdade depois do deslize — é o que
  // segura os rótulos até a largura final.
  const [target, setTarget] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const labelsVisible = !target && !collapsed;

  useEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    timer.current = setTimeout(() => setCollapsed(target), reduceMotion ? 0 : SLIDE_MS);
    return () => clearTimeout(timer.current);
  }, [target]);

  const toggleLabel = target ? 'Expandir menu' : 'Retrair menu';

  const handleItem = (item: NavItem) => {
    if (item.href) router.push(item.href);
    else avisoDecorativo(item.label);
  };

  return (
    <nav
      aria-label="Navegação do Cockpit"
      style={{ ...FONT, width: target ? WIDTH_COLLAPSED : WIDTH }}
      className="flex h-screen shrink-0 flex-col overflow-hidden bg-[var(--cockpit-navy)] transition-[width] duration-200 ease-out motion-reduce:transition-none"
    >
      <div className={`flex gap-3 px-4 pt-6 ${collapsed ? 'flex-col items-start pb-1' : 'flex-row items-center pb-8'}`}>
        <span className={`ml-[6px] flex text-[#F9F9F9] ${collapsed ? 'mt-1' : ''}`}>
          <BHubLogo size={20} />
        </span>
        {!collapsed && (
          <>
            <span
              className={`text-[1.2rem] font-bold text-white transition-opacity duration-200 ease-out ${
                labelsVisible ? 'opacity-100' : 'opacity-0'
              }`}
            >
              Cockpit<span className="text-coral-bold">.</span>
            </span>
            <span className="flex-1" />
          </>
        )}
        <button
          type="button"
          aria-label="Atividades — há novidades"
          title="Atividades"
          onClick={() => avisoDecorativo('Atividades')}
          className={`relative flex size-7 shrink-0 items-center justify-center rounded-lg text-[#69727D] transition-colors duration-150 ease-out hover:bg-white/[0.07] hover:text-[#F9F9F9] ${
            collapsed ? 'ml-[2px]' : ''
          }`}
        >
          <Bell size={16} />
          <span className="absolute top-[3px] right-[3px] size-2 rounded-full bg-orange-500" />
        </button>
        <button
          type="button"
          onClick={() => setTarget((current) => !current)}
          aria-label={toggleLabel}
          aria-expanded={!target}
          title={toggleLabel}
          className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-[#69727D] transition-colors duration-150 ease-out hover:bg-white/[0.07] hover:text-[#F9F9F9] ${
            collapsed ? 'ml-[2px]' : ''
          }`}
        >
          <PanelLeft
            size={16}
            className={`transition-transform duration-200 ease-out ${collapsed ? '-scale-x-100' : ''}`}
          />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto [scrollbar-color:rgba(255,255,255,0.16)_transparent] [scrollbar-width:thin]">
        {NAV_GROUPS.map((group, index) => (
          <div
            key={group.id}
            className={`px-[14px] ${index === 0 ? 'pt-2' : 'pt-3'} ${
              index < NAV_GROUPS.length - 1 ? 'border-b border-white/[0.08] pb-3' : 'pb-2'
            }`}
          >
            {group.label && labelsVisible && (
              <p className="px-[10px] pb-2 text-[11px] font-bold tracking-wide text-[#69727D] uppercase">
                {group.label}
              </p>
            )}
            <ul aria-label={group.label ?? group.id} className="m-0 flex list-none flex-col gap-1">
              {group.items.map((item) => (
                <li key={item.id}>
                  {item.children ? (
                    <Submenu item={item} collapsed={collapsed} labelsVisible={labelsVisible} />
                  ) : (
                    <ItemButton
                      item={item}
                      collapsed={collapsed}
                      labelsVisible={labelsVisible}
                      onClick={() => handleItem(item)}
                    />
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
