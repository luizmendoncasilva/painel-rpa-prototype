import 'dayjs/locale/pt-br';

import type { User, UserFormData } from 'src/types';

import dayjs from 'dayjs';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Badge,
  Empty,
  Table,
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

import { useAuthContext } from 'src/auth/context';

import { UserFormDialog } from './user-form-dialog';

// ----------------------------------------------------------------------

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

// ----------------------------------------------------------------------

export function UsersView() {
  const { user: currentUser } = useAuthContext();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [openForm, setOpenForm] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get(endpoints.users.list);
      setUsers(res.data as User[]);
    } catch {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenCreate = () => { setEditUser(null); setOpenForm(true); };
  const handleOpenEdit = (user: User) => { setEditUser(user); setOpenForm(true); };
  const handleCloseForm = () => setOpenForm(false);

  const handleSave = async (data: UserFormData) => {
    try {
      if (editUser) {
        await axios.patch(endpoints.users.update(editUser.id), data);
        toast.success('Usuário atualizado com sucesso');
      } else {
        await axios.post(endpoints.users.create, data);
        toast.success('Usuário criado com sucesso');
      }
      fetchUsers();
      handleCloseForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar usuário';
      toast.error(message);
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(endpoints.users.delete(id));
      toast.success('Usuário removido');
      fetchUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover usuário';
      toast.error(message);
    }
  };

  return (
    <DashboardContent maxWidth="xl">
      <div className="mb-8 flex items-center justify-between">
        <h4 className="text-2xl font-semibold">Usuários</h4>
        <Button onClick={handleOpenCreate}>
          <Plus className="size-4" />
          Novo Usuário
        </Button>
      </div>

      <Card padding="none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>E-mail</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead>Último acesso</TableHead>
              <TableHead className="text-right pr-6">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-16 text-center">
                  <Spinner className="mx-auto" size="lg" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-16 text-center">
                  <Empty title="Nenhum usuário cadastrado." />
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const isSelf = user.id === currentUser?.id;
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{user.email}</span>
                        {isSelf && <Badge variant="default">Voce</Badge>}
                      </div>
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {dayjs(user.created_at).format('DD/MM/YYYY HH:mm')}
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {user.last_sign_in_at ? dayjs(user.last_sign_in_at).fromNow() : '—'}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <IconButton
                              variant="ghost"
                              size="sm"
                              aria-label="Editar"
                              onClick={() => handleOpenEdit(user)}
                            >
                              <Pencil className="size-4" />
                            </IconButton>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <IconButton
                                variant="ghost"
                                size="sm"
                                aria-label="Remover"
                                disabled={isSelf}
                                onClick={() => handleDelete(user.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="size-4" />
                              </IconButton>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {isSelf ? 'Não é possível remover sua própria conta' : 'Remover'}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <UserFormDialog
        open={openForm}
        user={editUser}
        onClose={handleCloseForm}
        onSave={handleSave}
      />
    </DashboardContent>
  );
}
