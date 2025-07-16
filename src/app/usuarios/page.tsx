
"use client";

import * as React from "react";
import { MoreHorizontal, PlusCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createUser } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";


interface User {
    id: string;
    name: string;
    email: string;
    role: "Gestor" | "Motorista" | "Mecânico";
    status: "Ativo" | "Inativo";
}

const userSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  role: z.enum(["Gestor", "Motorista", "Mecânico"], { required_error: "A função é obrigatória" }),
});

type UserFormValues = z.infer<typeof userSchema>;

const roleVariant: { [key: string]: "default" | "secondary" | "outline" } = {
  "Gestor": "default",
  "Motorista": "secondary",
  "Mecânico": "outline",
};

export default function UsuariosPage() {
    const { toast } = useToast();
    const [open, setOpen] = React.useState(false);
    const [users, setUsers] = React.useState<User[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    const { control, handleSubmit, register, formState: { errors, isSubmitting }, reset } = useForm<UserFormValues>({
      resolver: zodResolver(userSchema),
      defaultValues: {
        name: "",
        email: "",
        password: "",
        role: "Motorista",
      }
    });

    React.useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setUsers(usersData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const onSubmit = async (data: UserFormValues) => {
      const result = await createUser(data);
      if (result.success) {
        toast({
          title: "Usuário Criado!",
          description: `O usuário ${data.name} foi criado com sucesso.`,
        });
        setOpen(false);
        reset();
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao criar usuário",
          description: result.error,
        });
      }
    };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Usuários"
        description="Gerencie os usuários do sistema."
      >
        <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) reset(); }}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2" />
                    Adicionar Usuário
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleSubmit(onSubmit)}>
                <DialogHeader>
                    <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                    <DialogDescription>
                        Preencha os dados para criar um novo acesso ao sistema.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nome</Label>
                        <div className="col-span-3">
                          <Input id="name" placeholder="Nome Completo" {...register("name")} />
                          {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <div className="col-span-3">
                          <Input id="email" type="email" placeholder="usuario@email.com" {...register("email")} />
                          {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
                        </div>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">Senha</Label>
                        <div className="col-span-3">
                          <Input id="password" type="password" placeholder="Senha inicial" {...register("password")} />
                          {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">Função</Label>
                        <div className="col-span-3">
                           <Controller
                              name="role"
                              control={control}
                              render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger id="role">
                                        <SelectValue placeholder="Selecione a função" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Gestor">Gestor</SelectItem>
                                        <SelectItem value="Motorista">Motorista</SelectItem>
                                        <SelectItem value="Mecânico">Mecânico</SelectItem>
                                    </SelectContent>
                                </Select>
                              )}
                            />
                            {errors.role && <p className="text-sm text-destructive mt-1">{errors.role.message}</p>}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isSubmitting ? 'Salvando...' : 'Salvar Usuário'}
                    </Button>
                </DialogFooter>
              </form>
            </DialogContent>
        </Dialog>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            Todos os usuários com acesso ao sistema RodoCheck.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.email}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={roleVariant[user.role] || 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                     <Badge variant={user.status === 'Ativo' ? 'secondary' : 'destructive'} className={user.status === 'Ativo' ? 'bg-green-500 hover:bg-green-600' : ''}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Resetar Senha</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Desativar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
