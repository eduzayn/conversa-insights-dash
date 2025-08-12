import { z } from "zod";

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50)
});

export const dateRangeQuery = z.object({
  dataInicio: z.string().datetime().optional(),
  dataFim: z.string().datetime().optional(),
  tipoData: z.enum(["criacao", "atualizacao"]).optional()
});

export const searchQuery = z.object({
  search: z.string().optional()
});

export const statusQuery = z.object({
  status: z.string().optional()
});

export const certificacoesQuery = paginationQuery.merge(dateRangeQuery).merge(searchQuery).extend({
  categoria: z.string().optional(),
  status: z.string().optional()
});

export const atendimentosQuery = paginationQuery.merge(dateRangeQuery).merge(searchQuery).extend({
  status: z.string().optional(),
  attendantId: z.coerce.number().optional()
});

export const negociacoesQuery = paginationQuery.merge(dateRangeQuery).merge(searchQuery).extend({
  status: z.string().optional()
});

export const quitacoesQuery = paginationQuery.merge(dateRangeQuery).merge(searchQuery).extend({
  status: z.string().optional()
});

export const enviosQuery = paginationQuery.merge(dateRangeQuery).merge(searchQuery).extend({
  status: z.string().optional()
});

export const certificacoesFadycQuery = paginationQuery.merge(searchQuery).extend({
  categoria: z.string().optional(),
  status: z.string().optional()
});

export const preRegisteredCoursesQuery = z.object({
  modalidade: z.string().optional(),
  categoria: z.string().optional(),
  ativo: z.coerce.boolean().optional()
});