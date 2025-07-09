import { db } from './server/db';
import { preRegisteredCourses } from './shared/schema';

const cursosPos = [
  { nome: 'Alfabetização e Letramento', cargaHoraria: 600, area: 'Educação' },
  { nome: 'Análise de Comportamento Aplicada ao Autismo – ABA com Habilitação em Docência no Ensino Superior', cargaHoraria: 600, area: 'Educação Especial' },
  { nome: 'Arbitragem, Mediação e Resolução de Conflitos', cargaHoraria: 600, area: 'Direito' },
  { nome: 'Arte e Educação', cargaHoraria: 580, area: 'Educação' },
  { nome: 'Atendimento Educacional Especializado com Ênfase em Educação Especial e Inclusiva', cargaHoraria: 760, area: 'Educação Especial' },
  { nome: 'Atendimento Educacional Especializado com Ênfase LIBRAS', cargaHoraria: 600, area: 'Educação Especial' },
  { nome: 'Atendimento Educacional Especializado com Ênfase TEA', cargaHoraria: 600, area: 'Educação Especial' },
  { nome: 'Autismo', cargaHoraria: 1100, area: 'Educação Especial' },
  { nome: 'Compliance', cargaHoraria: 600, area: 'Gestão' },
  { nome: 'Direito do Trabalho e Processual Trabalhista', cargaHoraria: 600, area: 'Direito' },
  { nome: 'Direito Público e Licitatório', cargaHoraria: 600, area: 'Direito' },
  { nome: 'Direito Tributário', cargaHoraria: 460, area: 'Direito' },
  { nome: 'Direito Tributário e Processual Tributário', cargaHoraria: 600, area: 'Direito' },
  { nome: 'Direitos e Novos Negócios', cargaHoraria: 600, area: 'Direito' },
  { nome: 'Direitos Humanos e Diversidade', cargaHoraria: 600, area: 'Direito' },
  { nome: 'Educação Especial e Inclusiva', cargaHoraria: 800, area: 'Educação Especial' },
  { nome: 'Educação Especial na Perspectiva da Educação Inclusiva', cargaHoraria: 580, area: 'Educação Especial' },
  { nome: 'Educação Multidisciplinar', cargaHoraria: 560, area: 'Educação' },
  { nome: 'Educação Musical', cargaHoraria: 580, area: 'Educação' },
  { nome: 'Educação Musical Inovadora', cargaHoraria: 600, area: 'Educação' },
  { nome: 'Ensino da Língua Portuguesa', cargaHoraria: 600, area: 'Educação' },
  { nome: 'Ensino de História e Geografia', cargaHoraria: 600, area: 'Educação' },
  { nome: 'Ensino de Literatura e Produção de Textos em Língua Espanhola', cargaHoraria: 600, area: 'Educação' },
  { nome: 'Ensino de Literatura e Produção de Textos em Língua Inglesa', cargaHoraria: 600, area: 'Educação' },
  { nome: 'Gestão de Hospitais', cargaHoraria: 600, area: 'Saúde' },
  { nome: 'Gestão de Saúde', cargaHoraria: 600, area: 'Saúde' },
  { nome: 'Gestão da Saúde Municipal', cargaHoraria: 600, area: 'Saúde' },
  { nome: 'Gestão e Orientação Escolar', cargaHoraria: 600, area: 'Gestão Escolar' },
  { nome: 'Gestão Empresarial', cargaHoraria: 600, area: 'Gestão' },
  { nome: 'Gestão Escolar', cargaHoraria: 820, area: 'Gestão Escolar' },
  { nome: 'Gestão Escolar com Ênfase em Direito Educacional', cargaHoraria: 560, area: 'Gestão Escolar' },
  { nome: 'Gestão Escolar Integradora com Ênfase em Supervisão, Orientação, Administração e Inspeção', cargaHoraria: 740, area: 'Gestão Escolar' },
  { nome: 'Gestão Estratégica de Marketing', cargaHoraria: 600, area: 'Gestão' },
  { nome: 'Gestão Jurídica', cargaHoraria: 600, area: 'Direito' },
  { nome: 'Gestão Pública Educacional', cargaHoraria: 600, area: 'Gestão Escolar' },
  { nome: 'História e Fundamentos da Filosofia', cargaHoraria: 600, area: 'Educação' },
  { nome: 'IA na Educação', cargaHoraria: 600, area: 'Tecnologia' },
  { nome: 'Informática Forense', cargaHoraria: 600, area: 'Tecnologia' },
  { nome: 'Inteligência Artificial', cargaHoraria: 600, area: 'Tecnologia' },
  { nome: 'Internet das Coisas', cargaHoraria: 600, area: 'Tecnologia' },
  { nome: 'Letras com Ênfase em Linguística', cargaHoraria: 600, area: 'Educação' },
  { nome: 'LIBRAS', cargaHoraria: 600, area: 'Educação Especial' },
  { nome: 'Marketing Político', cargaHoraria: 600, area: 'Gestão' },
  { nome: 'Metodologia do Ensino de Artes', cargaHoraria: 600, area: 'Educação' },
  { nome: 'Metodologia do Ensino de Filosofia', cargaHoraria: 640, area: 'Educação' },
  { nome: 'Metodologia do Ensino de Filosofia e Sociologia', cargaHoraria: 540, area: 'Educação' },
  { nome: 'Metodologia do Ensino de Geografia', cargaHoraria: 600, area: 'Educação' },
  { nome: 'Metodologia do Ensino de Matemática', cargaHoraria: 600, area: 'Educação' },
  { nome: 'Metodologia do Ensino de Matemática e Física', cargaHoraria: 520, area: 'Educação' },
  { nome: 'Metodologia do Ensino de Matemática – Nova Versão', cargaHoraria: 640, area: 'Educação' },
  { nome: 'Metodologias Ativas e Tecnologias Educacionais', cargaHoraria: 600, area: 'Educação' },
  { nome: 'Musicalização e Contação de História', cargaHoraria: 600, area: 'Educação' },
  { nome: 'Musicoterapia', cargaHoraria: 540, area: 'Saúde Mental' },
  { nome: 'Neurociência', cargaHoraria: 600, area: 'Saúde Mental' },
  { nome: 'Neuropsicologia', cargaHoraria: 540, area: 'Saúde Mental' },
  { nome: 'Neuropsicologia Clínica', cargaHoraria: 360, area: 'Saúde Mental' },
  { nome: 'Neuropsicopedagogia', cargaHoraria: 870, area: 'Saúde Mental' },
  { nome: 'Neuropsicopedagogia (versão nova)', cargaHoraria: 600, area: 'Saúde Mental' },
  { nome: 'Planejamento e Gestão de Trânsito', cargaHoraria: 680, area: 'Trânsito' },
  { nome: 'Psicanálise', cargaHoraria: 800, area: 'Saúde Mental' },
  { nome: 'Psicologia Clínica', cargaHoraria: 600, area: 'Saúde Mental' },
  { nome: 'Psicopedagogia Clínica', cargaHoraria: 680, area: 'Saúde Mental' },
  { nome: 'Psicopedagogia Clínica, Institucional e Hospitalar', cargaHoraria: 620, area: 'Saúde Mental' },
  { nome: 'Psicopedagogia com Ênfase em Neuro Educação', cargaHoraria: 600, area: 'Saúde Mental' },
  { nome: 'Psicopedagogia Escolar', cargaHoraria: 600, area: 'Saúde Mental' },
  { nome: 'Psicopedagogia Institucional e Clínica', cargaHoraria: 710, area: 'Saúde Mental' },
  { nome: 'Alfabetização, Letramento e Psicopedagogia', cargaHoraria: 600, area: 'Educação' },
  { nome: 'Segurança da Informação', cargaHoraria: 600, area: 'Tecnologia' },
  { nome: 'Sistema de Informação', cargaHoraria: 600, area: 'Tecnologia' },
  { nome: 'Supervisão Escolar', cargaHoraria: 600, area: 'Gestão Escolar' },
  { nome: 'Web Design', cargaHoraria: 600, area: 'Tecnologia' },
];

async function importPosGraduacaoCourses() {
  try {
    console.log('Importando cursos de pós-graduação...');
    
    for (const curso of cursosPos) {
      await db.insert(preRegisteredCourses).values({
        nome: curso.nome,
        modalidade: 'Pós-graduação',
        categoria: 'pos_graduacao',
        cargaHoraria: curso.cargaHoraria,
        area: curso.area,
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    console.log(`✅ ${cursosPos.length} cursos de pós-graduação importados com sucesso!`);
    
    // Verificar se foram importados corretamente
    const cursosImportados = await db.select().from(preRegisteredCourses);
    console.log(`📊 Total de cursos no banco: ${cursosImportados.length}`);
    
  } catch (error) {
    console.error('❌ Erro ao importar cursos:', error);
  }
}

// Executar o script
importPosGraduacaoCourses();