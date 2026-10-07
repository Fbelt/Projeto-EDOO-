#include <iostream>
#include "Menus.h"
#include "Ui.h"
#include "Input.h"
#include "StudentRepository.h"
#include "TeacherRepository.h"
#include "DisciplineRepository.h"
#include "ClassGroupRepository.h"
#include "EnrollmentRepository.h"

using namespace std;


// Diz se a matrícula já é usada por algum aluno OU professor
// (no banco, os dois ficam na mesma tabela "pessoas")
bool matriculaInUse(SchoolData& data, string matricula) {
    return findStudent(data, matricula) != nullptr || findTeacher(data, matricula) != nullptr;
}

// Lê os dias da semana da turma (ex: "SEG QUA") e devolve "SEG/QUA"
string readDays() {
    vector<string> valid = {"SEG", "TER", "QUA", "QUI", "SEX", "SAB"};
    while (true) {
        string text = ui::upper(readText("Dias da semana" + ui::muted(" (ex: SEG QUA)")));
        string result = "";
        bool ok = true;
        string word = "";
        text += " ";   // espaço no fim para fechar a última palavra
        for (char c : text) {
            if (c != ' ' && c != ',' && c != '/') {
                word += c;
                continue;
            }
            if (word == "") continue;
            bool found = false;
            for (string v : valid) {
                if (v == word) found = true;
            }
            if (!found) ok = false;
            result += (result == "" ? "" : "/") + word;
            word = "";
        }
        if (ok && result != "") return result;
        ui::error("Dia inválido.", "Use SEG, TER, QUA, QUI, SEX ou SAB, separados por espaço.");
    }
}

// ─────────────────────────────── ALUNOS ───────────────────────────────

void listStudents(SchoolData& data) {
    ui::screen("Administrador › Alunos › Lista");
    ui::title("Alunos cadastrados", to_string(data.students.size()) + " alunos");
    ui::Table table({"Nome", "Matrícula", "Curso", "Contato", "Turmas"});
    table.alignRight(4);
    for (Student* s : data.students) {
        table.add({s->getName(), s->getMatricula(), s->getCurso(), s->getContato(),
                   to_string(groupsOfStudent(data, *s, false).size())});
    }
    table.print();
    ui::pause();
}

void createStudent(SchoolData& data) {
    ui::screen("Administrador › Alunos › Cadastrar");
    ui::title("Novo aluno", "Preencha os dados. Todos os campos são obrigatórios.");

    string matricula = readText("Matrícula");
    if (matriculaInUse(data, matricula)) {
        ui::error("Já existe uma pessoa com a matrícula " + matricula + ".", "Use outra matrícula.");
        ui::pause();
        return;
    }
    string name = readText("Nome completo");
    string cpf = readCpf("CPF");
    string birthday = readDate("Nascimento");
    string course = readText("Curso");
    string contact = readText("E-mail ou telefone");

    // Cria o objeto, guarda na lista e salva no banco
    Student* s = new Student(name, birthday, cpf, matricula, course);
    s->setContato(contact);
    data.students.push_back(s);
    StudentRepository repo;
    repo.insert(*s);

    ui::success("Aluno " + name + " cadastrado.");
    ui::pause();
}

void viewStudent(SchoolData& data) {
    ui::screen("Administrador › Alunos › Ficha");
    ui::title("Ficha do aluno", "Escolha o aluno");
    Student* s = chooseStudent(data.students);
    if (s == nullptr) return;

    ui::screen("Administrador › Alunos › Ficha");
    ui::title("Ficha do aluno");
    // Polimorfismo: o ponteiro é de Person, mas roda o exibirInfo() de Student
    Person* p = s;
    p->exibirInfo();
    ui::pause();
}

void editStudent(SchoolData& data) {
    ui::screen("Administrador › Alunos › Editar");
    ui::title("Editar aluno", "Escolha o aluno");
    Student* s = chooseStudent(data.students);
    if (s == nullptr) return;

    ui::info("Pressione ENTER para manter o valor atual (entre colchetes).");
    s->setName(readTextOrKeep("Nome", s->getName()));
    s->setCurso(readTextOrKeep("Curso", s->getCurso()));
    s->setContato(readTextOrKeep("Contato", s->getContato()));

    StudentRepository repo;
    repo.update(*s);
    ui::success("Dados de " + s->getName() + " atualizados.");
    ui::pause();
}

void removeStudent(SchoolData& data) {
    ui::screen("Administrador › Alunos › Remover");
    ui::title("Remover aluno", "Escolha o aluno");
    Student* s = chooseStudent(data.students);
    if (s == nullptr) return;

    vector<ClassGroup*> groups = groupsOfStudent(data, *s, false);
    string warning = "O aluno " + s->getName() + " será apagado";
    if (groups.size() > 0) {
        warning += " e sairá de " + to_string(groups.size()) + " turma(s), com notas e frequência";
    }
    if (!confirm(warning + ". Isso não pode ser desfeito.")) {
        ui::info("Nada foi apagado.");
        ui::pause();
        return;
    }

    // 1) tira o aluno das turmas (memória e banco)
    EnrollmentRepository enrollmentRepo;
    for (ClassGroup* g : groups) {
        enrollmentRepo.remove(*g, *s);
        g->unenroll(*s);
    }
    // 2) apaga do banco
    StudentRepository repo;
    repo.remove(s->getMatricula());
    // 3) tira da lista e libera a memória
    for (int i = 0; i < data.students.size(); i++) {
        if (data.students[i] == s) {
            data.students.erase(data.students.begin() + i);
            break;
        }
    }
    string name = s->getName();
    delete s;

    ui::success("Aluno " + name + " removido.");
    ui::pause();
}

void studentsMenu(SchoolData& data) {
    while (true) {
        ui::screen("Administrador › Alunos");
        ui::title("Alunos", to_string(data.students.size()) + " cadastrados");
        ui::option("1", "Listar todos");
        ui::option("2", "Cadastrar aluno");
        ui::option("3", "Ver ficha", "exibirInfo()");
        ui::option("4", "Editar dados");
        ui::option("5", "Remover aluno", "pede confirmação");
        ui::backOption();

        string op = readOption();
        if (op == "1") listStudents(data);
        else if (op == "2") createStudent(data);
        else if (op == "3") viewStudent(data);
        else if (op == "4") editStudent(data);
        else if (op == "5") removeStudent(data);
        else if (op == "0") return;
        else { ui::error("Opção inválida.", "Digite um dos números da lista."); ui::pause(); }
    }
}

// ───────────────────────────── PROFESSORES ─────────────────────────────

void listTeachers(SchoolData& data) {
    ui::screen("Administrador › Professores › Lista");
    ui::title("Professores cadastrados", to_string(data.teachers.size()) + " professores");
    ui::Table table({"Nome", "Matrícula", "Contato", "Disciplinas", "Turmas"});
    table.alignRight(4);
    for (Teacher* t : data.teachers) {
        string disciplines = "";
        for (string code : t->getDisciplinas()) {
            disciplines += (disciplines == "" ? "" : ", ") + code;
        }
        table.add({t->getName(), t->getMatriculaFuncional(), t->getContato(),
                   disciplines == "" ? ui::muted("nenhuma") : disciplines,
                   to_string(groupsOfTeacher(data, *t).size())});
    }
    table.print();
    ui::pause();
}

void createTeacher(SchoolData& data) {
    ui::screen("Administrador › Professores › Cadastrar");
    ui::title("Novo professor", "Preencha os dados. Todos os campos são obrigatórios.");

    string matricula = readText("Matrícula funcional");
    if (matriculaInUse(data, matricula)) {
        ui::error("Já existe uma pessoa com a matrícula " + matricula + ".", "Use outra matrícula.");
        ui::pause();
        return;
    }
    string name = readText("Nome completo");
    string cpf = readCpf("CPF");
    string birthday = readDate("Nascimento");
    string contact = readText("E-mail ou telefone");

    Teacher* t = new Teacher(name, birthday, cpf, matricula);
    t->setContato(contact);
    data.teachers.push_back(t);
    TeacherRepository repo;
    repo.insert(*t);

    ui::success("Professor " + name + " cadastrado.");
    ui::pause();
}

void viewTeacher(SchoolData& data) {
    ui::screen("Administrador › Professores › Ficha");
    ui::title("Ficha do professor", "Escolha o professor");
    Teacher* t = chooseTeacher(data.teachers);
    if (t == nullptr) return;

    ui::screen("Administrador › Professores › Ficha");
    ui::title("Ficha do professor");
    // Polimorfismo: mesmo ponteiro Person*, mas roda o exibirInfo() de Teacher
    Person* p = t;
    p->exibirInfo();
    ui::pause();
}

void editTeacher(SchoolData& data) {
    ui::screen("Administrador › Professores › Editar");
    ui::title("Editar professor", "Escolha o professor");
    Teacher* t = chooseTeacher(data.teachers);
    if (t == nullptr) return;

    ui::info("Pressione ENTER para manter o valor atual (entre colchetes).");
    t->setName(readTextOrKeep("Nome", t->getName()));
    t->setContato(readTextOrKeep("Contato", t->getContato()));

    TeacherRepository repo;
    repo.update(*t);
    ui::success("Dados de " + t->getName() + " atualizados.");
    ui::pause();
}

void removeTeacher(SchoolData& data) {
    ui::screen("Administrador › Professores › Remover");
    ui::title("Remover professor", "Escolha o professor");
    Teacher* t = chooseTeacher(data.teachers);
    if (t == nullptr) return;

    // Prevenção de erro: não deixa apagar professor que ainda tem turma ou disciplina
    if (groupsOfTeacher(data, *t).size() > 0 || t->getDisciplinas().size() > 0) {
        ui::error(t->getName() + " ainda é responsável por disciplinas ou turmas.",
                  "Troque o professor das disciplinas e remova as turmas dele antes.");
        ui::pause();
        return;
    }
    if (!confirm("O professor " + t->getName() + " será apagado. Isso não pode ser desfeito.")) {
        ui::info("Nada foi apagado.");
        ui::pause();
        return;
    }

    TeacherRepository repo;
    repo.remove(t->getMatriculaFuncional());
    for (int i = 0; i < data.teachers.size(); i++) {
        if (data.teachers[i] == t) {
            data.teachers.erase(data.teachers.begin() + i);
            break;
        }
    }
    string name = t->getName();
    delete t;

    ui::success("Professor " + name + " removido.");
    ui::pause();
}

void teachersMenu(SchoolData& data) {
    while (true) {
        ui::screen("Administrador › Professores");
        ui::title("Professores", to_string(data.teachers.size()) + " cadastrados");
        ui::option("1", "Listar todos");
        ui::option("2", "Cadastrar professor");
        ui::option("3", "Ver ficha", "exibirInfo()");
        ui::option("4", "Editar dados");
        ui::option("5", "Remover professor", "pede confirmação");
        ui::backOption();

        string op = readOption();
        if (op == "1") listTeachers(data);
        else if (op == "2") createTeacher(data);
        else if (op == "3") viewTeacher(data);
        else if (op == "4") editTeacher(data);
        else if (op == "5") removeTeacher(data);
        else if (op == "0") return;
        else { ui::error("Opção inválida.", "Digite um dos números da lista."); ui::pause(); }
    }
}

// ───────────────────────────── DISCIPLINAS ─────────────────────────────

void listDisciplines(SchoolData& data) {
    ui::screen("Administrador › Disciplinas › Lista");
    ui::title("Disciplinas cadastradas", to_string(data.disciplines.size()) + " disciplinas");
    ui::Table table({"Código", "Nome", "Carga", "Professor", "Prova final", "Ementa"});
    table.alignRight(2);
    for (Discipline* d : data.disciplines) {
        string teacher = d->getTeacher() != nullptr ? d->getTeacher()->getName() : ui::muted("sem professor");
        table.add({d->getCode(), d->getName(), to_string(d->getWorkload()) + "h", teacher,
                   d->getHasFinalExam() ? "Sim" : "Não", ui::muted(d->getSyllabus())});
    }
    table.print();
    ui::pause();
}

// Troca o professor responsável e atualiza a lista de disciplinas dos professores
void setDisciplineTeacher(Discipline& d, Teacher* newTeacher) {
    if (d.getTeacher() != nullptr) {
        d.getTeacher()->removeDisciplina(d.getCode());
    }
    d.setTeacher(newTeacher);
    if (newTeacher != nullptr) {
        newTeacher->addDisciplina(d.getCode());
    }
}

void createDiscipline(SchoolData& data) {
    ui::screen("Administrador › Disciplinas › Cadastrar");
    ui::title("Nova disciplina", "Preencha os dados da disciplina");

    string code = ui::upper(readText("Código" + ui::muted(" (ex: CIN0135)")));
    if (findDiscipline(data, code) != nullptr) {
        ui::error("Já existe uma disciplina com o código " + code + ".", "Use outro código.");
        ui::pause();
        return;
    }
    string name = readText("Nome");
    int workload = readInt("Carga horária (horas)", 1, 300);
    string syllabus = readText("Ementa (resumo)");
    bool finalExam = readYesNo("Tem prova final");

    Discipline* d = new Discipline(code, name, workload, syllabus, finalExam);

    ui::section("PROFESSOR RESPONSÁVEL");
    Teacher* t = chooseTeacher(data.teachers);
    setDisciplineTeacher(*d, t);   // t pode ser nullptr (0 = sem professor)

    data.disciplines.push_back(d);
    DisciplineRepository repo;
    repo.insert(*d);

    ui::success("Disciplina " + code + " - " + name + " cadastrada.");
    ui::pause();
}

void editDiscipline(SchoolData& data) {
    ui::screen("Administrador › Disciplinas › Editar");
    ui::title("Editar disciplina", "Escolha a disciplina");
    Discipline* d = chooseDiscipline(data.disciplines);
    if (d == nullptr) return;

    ui::info("Pressione ENTER para manter o valor atual (entre colchetes).");
    d->setName(readTextOrKeep("Nome", d->getName()));
    d->setSyllabus(readTextOrKeep("Ementa", d->getSyllabus()));
    if (readYesNo("Mudar a carga horária (" + to_string(d->getWorkload()) + "h)")) {
        d->setWorkload(readInt("Nova carga horária", 1, 300));
    }
    if (readYesNo("Trocar o professor responsável")) {
        setDisciplineTeacher(*d, chooseTeacher(data.teachers));
    }

    DisciplineRepository repo;
    repo.update(*d);
    ui::success("Disciplina " + d->getCode() + " atualizada.");
    ui::pause();
}

void removeDiscipline(SchoolData& data) {
    ui::screen("Administrador › Disciplinas › Remover");
    ui::title("Remover disciplina", "Escolha a disciplina");
    Discipline* d = chooseDiscipline(data.disciplines);
    if (d == nullptr) return;

    for (ClassGroup* g : data.groups) {
        if (g->getDiscipline() == d) {
            ui::error("A disciplina tem turmas (ex: " + g->getCode() + ").", "Remova as turmas dela antes.");
            ui::pause();
            return;
        }
    }
    if (!confirm("A disciplina " + d->getCode() + " será apagada. Isso não pode ser desfeito.")) {
        ui::info("Nada foi apagado.");
        ui::pause();
        return;
    }

    setDisciplineTeacher(*d, nullptr);
    DisciplineRepository repo;
    repo.remove(d->getCode());
    for (int i = 0; i < data.disciplines.size(); i++) {
        if (data.disciplines[i] == d) {
            data.disciplines.erase(data.disciplines.begin() + i);
            break;
        }
    }
    string code = d->getCode();
    delete d;

    ui::success("Disciplina " + code + " removida.");
    ui::pause();
}

void disciplinesMenu(SchoolData& data) {
    while (true) {
        ui::screen("Administrador › Disciplinas");
        ui::title("Disciplinas", to_string(data.disciplines.size()) + " cadastradas");
        ui::option("1", "Listar todas");
        ui::option("2", "Cadastrar disciplina");
        ui::option("3", "Editar disciplina");
        ui::option("4", "Remover disciplina", "pede confirmação");
        ui::backOption();

        string op = readOption();
        if (op == "1") listDisciplines(data);
        else if (op == "2") createDiscipline(data);
        else if (op == "3") editDiscipline(data);
        else if (op == "4") removeDiscipline(data);
        else if (op == "0") return;
        else { ui::error("Opção inválida.", "Digite um dos números da lista."); ui::pause(); }
    }
}

// ─────────────────────────────── TURMAS ───────────────────────────────

void createGroup(SchoolData& data) {
    ui::screen("Administrador › Turmas › Criar");
    ui::title("Nova turma", "Primeiro, escolha a disciplina");
    Discipline* d = chooseDiscipline(data.disciplines);
    if (d == nullptr) return;

    string semester = readText("Semestre" + ui::muted(" (ex: 2026.2)"));
    string suggestion = d->getCode() + "-" + semester;
    string code = ui::upper(readTextOrKeep("Código da turma", suggestion));
    if (findGroup(data, code) != nullptr) {
        ui::error("Já existe a turma " + code + ".", "Use outro código.");
        ui::pause();
        return;
    }
    string days = readDays();
    int start = readInt("Hora de início" + ui::muted(" (7 a 21)"), 7, 21);
    int end = readInt("Hora de fim" + ui::muted(" (" + to_string(start + 1) + " a 22)"), start + 1, 22);
    string schedule = days + " " + to_string(start) + "h-" + to_string(end) + "h";
    int capacity = readInt("Limite de vagas", 1, 200);

    // O professor da turma é o responsável pela disciplina (ou escolhe outro)
    Teacher* t = d->getTeacher();
    if (t == nullptr || !readYesNo("Professor: " + t->getName() + ". Manter")) {
        ui::section("PROFESSOR DA TURMA");
        t = chooseTeacher(data.teachers);
    }

    ClassGroup* g = new ClassGroup(code, d, t, semester, schedule, capacity);
    data.groups.push_back(g);
    ClassGroupRepository repo;
    repo.insert(*g);

    ui::success("Turma " + code + " criada · " + schedule + " · " + to_string(capacity) + " vagas.");
    ui::pause();
}

void listGroups(SchoolData& data) {
    ui::screen("Administrador › Turmas › Lista");
    ui::title("Turmas", to_string(data.groups.size()) + " turmas");
    ui::Table table({"Turma", "Disciplina", "Professor", "Semestre", "Horário", "Vagas", "Status"});
    table.alignRight(5);
    for (ClassGroup* g : data.groups) {
        string teacher = g->getTeacher() != nullptr ? g->getTeacher()->getName() : ui::muted("—");
        table.add({g->getCode(), g->getDiscipline()->getName(), teacher, g->getSemester(), g->getSchedule(),
                   to_string(g->getEnrollments().size()) + "/" + to_string(g->getCapacity()),
                   g->isFinished() ? ui::muted("Encerrada") : ui::good("Aberta")});
    }
    table.print();
    ui::pause();
}

void finishGroup(SchoolData& data) {
    ui::screen("Administrador › Turmas › Encerrar");
    ui::title("Encerrar turma", "Depois de encerrada, a situação final de cada aluno é calculada");
    vector<ClassGroup*> open;
    for (ClassGroup* g : data.groups) {
        if (!g->isFinished()) open.push_back(g);
    }
    ClassGroup* g = chooseGroup(open);
    if (g == nullptr) return;

    if (!confirm("A turma " + g->getCode() + " será encerrada e não aceitará mais matrículas.")) {
        ui::info("A turma continua aberta.");
        ui::pause();
        return;
    }
    g->finish();
    ClassGroupRepository repo;
    repo.update(*g);

    ui::screen("Administrador › Turmas › Encerrar");
    ui::success("Turma " + g->getCode() + " encerrada. Resultado final:");
    ui::blank();
    showGroupReport(*g);
    ui::pause();
}

void removeGroup(SchoolData& data) {
    ui::screen("Administrador › Turmas › Remover");
    ui::title("Remover turma", "Escolha a turma");
    ClassGroup* g = chooseGroup(data.groups);
    if (g == nullptr) return;

    int students = g->getEnrollments().size();
    if (!confirm("A turma " + g->getCode() + " e as " + to_string(students) +
                 " matrícula(s) dela serão apagadas. Isso não pode ser desfeito.")) {
        ui::info("Nada foi apagado.");
        ui::pause();
        return;
    }

    // Apaga as matrículas do banco, depois a turma
    EnrollmentRepository enrollmentRepo;
    for (Enrollment* e : g->getEnrollments()) {
        enrollmentRepo.remove(*g, *e->getStudent());
    }
    ClassGroupRepository repo;
    repo.remove(g->getCode());
    for (int i = 0; i < data.groups.size(); i++) {
        if (data.groups[i] == g) {
            data.groups.erase(data.groups.begin() + i);
            break;
        }
    }
    string code = g->getCode();
    delete g;   // o destrutor de ClassGroup apaga as matrículas da memória

    ui::success("Turma " + code + " removida.");
    ui::pause();
}

void groupsMenu(SchoolData& data) {
    while (true) {
        ui::screen("Administrador › Turmas");
        ui::title("Turmas", to_string(data.groups.size()) + " turmas");
        ui::option("1", "Listar turmas");
        ui::option("2", "Criar turma");
        ui::option("3", "Encerrar turma", "calcula a situação final");
        ui::option("4", "Remover turma", "pede confirmação");
        ui::backOption();

        string op = readOption();
        if (op == "1") listGroups(data);
        else if (op == "2") createGroup(data);
        else if (op == "3") finishGroup(data);
        else if (op == "4") removeGroup(data);
        else if (op == "0") return;
        else { ui::error("Opção inválida.", "Digite um dos números da lista."); ui::pause(); }
    }
}

// ───────────────────────────── MATRÍCULAS ─────────────────────────────

void enrollStudent(SchoolData& data) {
    ui::screen("Administrador › Matrículas › Matricular");
    ui::title("Matricular aluno", "Passo 1 de 2 · escolha a turma");
    ClassGroup* g = chooseGroup(data.groups);
    if (g == nullptr) return;

    // Confere as regras antes, para mostrar uma mensagem clara
    if (g->isFinished()) {
        ui::error("A turma " + g->getCode() + " está encerrada.", "Escolha uma turma aberta.");
        ui::pause();
        return;
    }
    if (g->getEnrollments().size() >= g->getCapacity()) {
        ui::error("A turma " + g->getCode() + " está lotada (" + to_string(g->getCapacity()) + " vagas).",
                  "Remova um aluno ou crie outra turma.");
        ui::pause();
        return;
    }

    ui::screen("Administrador › Matrículas › Matricular");
    ui::title("Matricular aluno", "Passo 2 de 2 · escolha o aluno para " + g->getCode());
    Student* s = chooseStudent(data.students);
    if (s == nullptr) return;

    if (g->findEnrollment(*s) != nullptr) {
        ui::error(s->getName() + " já está na turma " + g->getCode() + ".");
        ui::pause();
        return;
    }

    // Matricula (memória) e salva (banco)
    g->enroll(*s);
    EnrollmentRepository repo;
    repo.save(*g, *g->findEnrollment(*s));

    int free = g->getCapacity() - g->getEnrollments().size();
    ui::success(s->getName() + " matriculado(a) em " + g->getCode() + ". Restam " + to_string(free) + " vaga(s).");
    ui::pause();
}

void unenrollStudent(SchoolData& data) {
    ui::screen("Administrador › Matrículas › Desmatricular");
    ui::title("Desmatricular aluno", "Passo 1 de 2 · escolha a turma");
    ClassGroup* g = chooseGroup(data.groups);
    if (g == nullptr) return;

    ui::screen("Administrador › Matrículas › Desmatricular");
    ui::title("Desmatricular aluno", "Passo 2 de 2 · escolha o aluno de " + g->getCode());
    Enrollment* e = chooseEnrollment(*g);
    if (e == nullptr) return;

    Student* s = e->getStudent();
    if (!confirm(s->getName() + " sairá da turma e perderá as notas e a frequência dela.")) {
        ui::info("A matrícula foi mantida.");
        ui::pause();
        return;
    }

    EnrollmentRepository repo;
    repo.remove(*g, *s);
    g->unenroll(*s);   // depois disso o "e" não existe mais

    ui::success(s->getName() + " saiu da turma " + g->getCode() + ".");
    ui::pause();
}

void enrollmentsMenu(SchoolData& data) {
    while (true) {
        ui::screen("Administrador › Matrículas");
        ui::title("Matrículas", "Colocar e tirar alunos das turmas");
        ui::option("1", "Matricular aluno", "confere vagas e repetição");
        ui::option("2", "Desmatricular aluno", "pede confirmação");
        ui::backOption();

        string op = readOption();
        if (op == "1") enrollStudent(data);
        else if (op == "2") unenrollStudent(data);
        else if (op == "0") return;
        else { ui::error("Opção inválida.", "Digite um dos números da lista."); ui::pause(); }
    }
}

// ─────────────────────────── BUSCA E RELATÓRIOS ───────────────────────────

// Busca o texto no nome/código de alunos, professores, disciplinas e turmas
void search(SchoolData& data) {
    ui::screen("Administrador › Buscar");
    ui::title("Buscar", "Procura em alunos, professores, disciplinas e turmas");
    string text = readText("Nome, matrícula ou código");

    ui::screen("Administrador › Buscar");
    ui::title("Resultados para \"" + text + "\"");
    int total = 0;

    ui::Table students({"Aluno", "Matrícula", "Curso"});
    for (Student* s : data.students) {
        if (containsIgnoreCase(s->getName(), text) || containsIgnoreCase(s->getMatricula(), text)) {
            students.add({s->getName(), s->getMatricula(), s->getCurso()});
            total++;
        }
    }
    ui::Table teachers({"Professor", "Matrícula", "Contato"});
    for (Teacher* t : data.teachers) {
        if (containsIgnoreCase(t->getName(), text) || containsIgnoreCase(t->getMatriculaFuncional(), text)) {
            teachers.add({t->getName(), t->getMatriculaFuncional(), t->getContato()});
            total++;
        }
    }
    ui::Table disciplines({"Disciplina", "Código", "Carga"});
    for (Discipline* d : data.disciplines) {
        if (containsIgnoreCase(d->getName(), text) || containsIgnoreCase(d->getCode(), text)) {
            disciplines.add({d->getName(), d->getCode(), to_string(d->getWorkload()) + "h"});
            total++;
        }
    }
    ui::Table groups({"Turma", "Disciplina", "Semestre"});
    for (ClassGroup* g : data.groups) {
        if (containsIgnoreCase(g->getCode(), text)) {
            groups.add({g->getCode(), g->getDiscipline()->getName(), g->getSemester()});
            total++;
        }
    }

    // Só mostra as tabelas que acharam alguma coisa
    if (!students.empty()) { ui::section("ALUNOS"); students.print(); }
    if (!teachers.empty()) { ui::section("PROFESSORES"); teachers.print(); }
    if (!disciplines.empty()) { ui::section("DISCIPLINAS"); disciplines.print(); }
    if (!groups.empty()) { ui::section("TURMAS"); groups.print(); }

    if (total == 0) {
        ui::warning("Nada encontrado.");
        ui::text(ui::muted("  Tente só uma parte do nome, ex: \"jo\" acha \"Joao\"."));
    } else {
        ui::info(to_string(total) + " resultado(s).");
    }
    ui::pause();
}

void groupReport(SchoolData& data) {
    ui::screen("Administrador › Relatório de turma");
    ui::title("Relatório de turma", "Escolha a turma");
    ClassGroup* g = chooseGroup(data.groups);
    if (g == nullptr) return;

    ui::screen("Administrador › Relatório de turma");
    showGroupReport(*g);
    ui::pause();
}

void transcript(SchoolData& data) {
    ui::screen("Administrador › Histórico escolar");
    ui::title("Histórico escolar", "Escolha o aluno");
    Student* s = chooseStudent(data.students);
    if (s == nullptr) return;

    ui::screen("Administrador › Histórico escolar");
    ui::title("Histórico escolar");
    showTranscript(data, *s);
    ui::pause();
}

// ─────────────────────────────── MENU ───────────────────────────────

// Taxa de aprovação de todas as turmas encerradas (para o painel)
string overallApprovalRate(SchoolData& data) {
    int total = 0, approved = 0;
    for (ClassGroup* g : data.groups) {
        if (!g->isFinished()) continue;
        for (Enrollment* e : g->getEnrollments()) {
            total++;
            if (g->getStatus(e) == "Aprovado") approved++;
        }
    }
    if (total == 0) return "—";
    return ui::number(approved * 100.0 / total, 0) + "%";
}

void adminMenu(SchoolData& data) {
    ui::setTheme(ui::ADMIN, "Administrador");
    while (true) {
        ui::screen("Administrador");
        ui::title("Painel da Secretaria", "Visão geral do sistema");
        ui::statCards({to_string(data.students.size()), to_string(data.teachers.size()),
                       to_string(data.disciplines.size()), overallApprovalRate(data)},
                      {"alunos", "professores", "disciplinas", "aprovação geral"});

        ui::section("CADASTROS");
        ui::option("1", "Alunos", "listar, cadastrar, editar, remover");
        ui::option("2", "Professores", "listar, cadastrar, editar, remover");
        ui::option("3", "Disciplinas", "listar, cadastrar, editar, remover");
        ui::section("TURMAS");
        ui::option("4", "Turmas", "criar, encerrar, remover");
        ui::option("5", "Matrículas", "matricular e desmatricular");
        ui::section("CONSULTAS");
        ui::option("6", "Buscar", "em todo o sistema");
        ui::option("7", "Relatório de turma", "média e taxa de aprovação");
        ui::option("8", "Histórico escolar", "de um aluno");
        ui::option("?", "Ajuda", "regras e navegação");
        ui::backOption("Trocar de perfil");

        string op = readOption();
        if (op == "1") studentsMenu(data);
        else if (op == "2") teachersMenu(data);
        else if (op == "3") disciplinesMenu(data);
        else if (op == "4") groupsMenu(data);
        else if (op == "5") enrollmentsMenu(data);
        else if (op == "6") search(data);
        else if (op == "7") groupReport(data);
        else if (op == "8") transcript(data);
        else if (op == "?") { ui::screen("Administrador › Ajuda"); showHelp(); }
        else if (op == "0") return;
        else { ui::error("Opção inválida.", "Digite um dos números da lista."); ui::pause(); }
    }
}
