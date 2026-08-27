import type { Bot, BotFormData } from 'src/types';

import { toast } from 'sonner';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Play, Pencil, Search, Trash2, ArrowUp, FileText, ArrowDown, ArrowUpDown } from 'lucide-react';
import {
  Card,
  Table,
  Empty,
  Input,
  Button,
  Spinner,
  Tooltip,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  IconButton,
  TableHeader,
  TooltipContent,
  TooltipTrigger,
} from '@bhubai/bhub-design-system';

import axios, { endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { BotFormDialog } from './bot-form-dialog';
import { BotLogsDialog } from './bot-logs-dialog';
import { BotExecuteDialog } from './bot-execute-dialog';

// ----------------------------------------------------------------------

type SortableColumn = 'name' | 'bot_id' | 'description';

function SortIcon({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) {
  if (!active) return <ArrowUpDown className="size-3.5 text-muted-foreground" />;
  return direction === 'asc' ? (
    <ArrowUp className="size-3.5" />
  ) : (
    <ArrowDown className="size-3.5" />
  );
}

// ----------------------------------------------------------------------

export function BotsView() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [orderBy, setOrderBy] = useState<keyof Bot>('name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [editBot, setEditBot] = useState<Bot | null>(null);
  const [executeBot, setExecuteBot] = useState<Bot | null>(null);
  const [logsBot, setLogsBot] = useState<Bot | null>(null);
  const [openForm, setOpenForm] = useState(false);

  const fetchBots = useCallback(async () => {
    try {
      const res = await axios.get(endpoints.bots.list);
      setBots(res.data as Bot[]);
    } catch {
      toast.error('Erro ao carregar bots');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBots();
  }, [fetchBots]);

  const handleOpenCreate = () => { setEditBot(null); setOpenForm(true); };
  const handleOpenEdit = (bot: Bot) => { setEditBot(bot); setOpenForm(true); };
  const handleCloseForm = () => setOpenForm(false);

  const handleSave = async (data: BotFormData) => {
    try {
      if (editBot) {
        await axios.patch(endpoints.bots.update(editBot.id), data);
        toast.success('Bot atualizado com sucesso');
      } else {
        await axios.post(endpoints.bots.create, data);
        toast.success('Bot criado com sucesso');
      }
      fetchBots();
      handleCloseForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar bot';
      toast.error(message);
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(endpoints.bots.delete(id));
      toast.success('Bot removido');
      fetchBots();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover bot';
      toast.error(message);
    }
  };

  const handleSort = (col: SortableColumn) => {
    setOrder((prev) => (orderBy === col && prev === 'asc' ? 'desc' : 'asc'));
    setOrderBy(col);
  };

  const filteredBots = bots
    .filter((b) => {
      const q = search.toLowerCase();
      return (
        b.name?.toLowerCase().includes(q) ||
        b.bot_id?.toLowerCase().includes(q) ||
        b.description?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const aVal = String(a[orderBy] ?? '').toLowerCase();
      const bVal = String(b[orderBy] ?? '').toLowerCase();
      return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

  const handleExecute = async () => {
    if (!executeBot) return;
    try {
      const res = await axios.post(endpoints.bots.execute(executeBot.id));
      const data = res.data as { id?: string; detail?: string };
      toast.success(data.id ? `Task criada: ${data.id}` : (data.detail ?? 'Task criada'));
      setExecuteBot(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao executar bot';
      toast.error(message);
    }
  };

  return (
    <DashboardContent maxWidth="xl">
      <div className="mb-8 flex items-center justify-between">
        <h4 className="text-2xl font-semibold">Bots</h4>
        <Button variant="default" onClick={handleOpenCreate}>
          <Plus className="size-4" />
          Novo Bot
        </Button>
      </div>

      <Card padding="none">
        <div className="flex justify-end px-4 pt-4 pb-3">
          <div className="relative w-90 max-w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, Bot ID ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="max-h-[560px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-medium"
                    onClick={() => handleSort('name')}
                  >
                    Nome
                    <SortIcon active={orderBy === 'name'} direction={order} />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-medium"
                    onClick={() => handleSort('bot_id')}
                  >
                    Bot ID
                    <SortIcon active={orderBy === 'bot_id'} direction={order} />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-medium"
                    onClick={() => handleSort('description')}
                  >
                    Descrição
                    <SortIcon active={orderBy === 'description'} direction={order} />
                  </button>
                </TableHead>
                <TableHead className="pr-6 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-16 text-center">
                    <Spinner size="lg" className="mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredBots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-16 text-center">
                    <Empty
                      title={search ? 'Nenhum bot encontrado para esta busca.' : 'Nenhum bot cadastrado.'}
                      description={search ? undefined : 'Clique em "Novo Bot" para começar.'}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredBots.map((bot) => (
                  <TableRow key={bot.id}>
                    <TableCell>
                      <span className="text-sm font-semibold">{bot.name}</span>
                    </TableCell>

                    <TableCell>
                      <span className="font-mono text-sm text-muted-foreground">{bot.bot_id}</span>
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {bot.description || '—'}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <IconButton
                              aria-label="Executar agora"
                              variant="ghost"
                              size="sm"
                              className="text-success"
                              onClick={() => setExecuteBot(bot)}
                            >
                              <Play className="size-4" />
                            </IconButton>
                          </TooltipTrigger>
                          <TooltipContent>Executar agora</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <IconButton
                              aria-label="Editar credenciais"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(bot)}
                            >
                              <Pencil className="size-4" />
                            </IconButton>
                          </TooltipTrigger>
                          <TooltipContent>Editar credenciais</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <IconButton
                              aria-label="Ver logs"
                              variant="ghost"
                              size="sm"
                              onClick={() => setLogsBot(bot)}
                            >
                              <FileText className="size-4" />
                            </IconButton>
                          </TooltipTrigger>
                          <TooltipContent>Ver logs</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <IconButton
                              aria-label="Remover"
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => handleDelete(bot.id)}
                            >
                              <Trash2 className="size-4" />
                            </IconButton>
                          </TooltipTrigger>
                          <TooltipContent>Remover</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <BotFormDialog
        open={openForm}
        bot={editBot}
        onClose={handleCloseForm}
        onSave={handleSave}
      />

      <BotExecuteDialog
        open={Boolean(executeBot)}
        bot={executeBot}
        onClose={() => setExecuteBot(null)}
        onConfirm={handleExecute}
      />

      <BotLogsDialog
        open={Boolean(logsBot)}
        bot={logsBot}
        onClose={() => setLogsBot(null)}
      />
    </DashboardContent>
  );
}
