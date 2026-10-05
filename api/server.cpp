// ═══════════════════════════════════════════════════════════════════
//  Servidor da interface web (bônus)
//
//  O React (navegador) não consegue chamar classes C++ direto.
//  Então este programa abre um "endereço" (http://localhost:8080)
//  e responde aos pedidos do React com texto em JSON.
//
//  Ideia geral:  React pede  →  servidor chama as classes do grupo  →  responde JSON
//
//  Todas as regras (vagas, média, aprovação...) continuam nas classes
//  do grupo. Este arquivo só recebe o pedido, chama o método certo,
//  salva com o repositório e devolve o resultado.
//
//  Biblioteca usada: cpp-httplib (api/httplib.h), baixada do GitHub.
//  Não foi escrita pelo grupo, assim como o SQLite.
// ═══════════════════════════════════════════════════════════════════

#include "httplib.h"
#include <iostream>
#include <sstream>
#include "Database.h"
#include "Seed.h"
#include "SchoolData.h"
#include "StudentRepository.h"
#include "TeacherRepository.h"
#include "DisciplineRepository.h"
#include "ClassGroupRepository.h"
#include "EnrollmentRepository.h"

using namespace std;
using namespace httplib;

// Todos os dados do sistema, carregados do banco quando o servidor liga
SchoolData school;

// ─────────────────────────── Montando o JSON ───────────────────────────
// JSON é só texto. Ex: {"nome": "Joao", "media": 8.5}

// Texto entre aspas, trocando " e \ para não quebrar o JSON
string text(string s) {
    string out = "\"";
    for (char c : s) {
        if (c == '"' || c == '\\') out += '\\';
        out += c;
    }
    return out + "\"";
}

// Número decimal (ex: 8.5)
string number(double value) {
    ostringstream out;
    out << value;
    return out.str();
}

string jsonBool(bool value) {
    return value ? "true" : "false";
}

string studentJson(Student& s) {
    return "{\"matricula\": " + text(s.getMatricula()) + ", \"nome\": " + text(s.getName()) +
           ", \"cpf\": " + text(s.getCpf()) + ", \"nascimento\": " + text(s.getBirthday()) +
           ", \"contato\": " + text(s.getContato()) + ", \"curso\": " + text(s.getCurso()) + "}";
}

string teacherJson(Teacher& t) {
    string disciplines = "";
    for (string code : t.getDisciplinas()) {
        if (disciplines != "") disciplines += ", ";
        disciplines += text(code);
    }
    return "{\"matricula\": " + text(t.getMatriculaFuncional()) + ", \"nome\": " + text(t.getName()) +
           ", \"cpf\": " + text(t.getCpf()) + ", \"nascimento\": " + text(t.getBirthday()) +
           ", \"contato\": " + text(t.getContato()) + ", \"disciplinas\": [" + disciplines + "]}";
}

string disciplineJson(Discipline& d) {
    string teacher = d.getTeacher() != nullptr ? text(d.getTeacher()->getMatriculaFuncional()) : "null";
    return "{\"codigo\": " + text(d.getCode()) + ", \"nome\": " + text(d.getName()) +
           ", \"cargaHoraria\": " + to_string(d.getWorkload()) + ", \"ementa\": " + text(d.getSyllabus()) +
           ", \"temFinal\": " + jsonBool(d.getHasFinalExam()) + ", \"professor\": " + teacher + "}";
}

// Matrícula de um aluno numa turma, com tudo já calculado pelas classes
string enrollmentJson(ClassGroup& g, Enrollment& e) {
    string grades = "";
    for (double grade : e.getGrades()) {
        if (grades != "") grades += ", ";
        grades += number(grade);
    }
    return "{\"aluno\": " + text(e.getStudent()->getMatricula()) +
           ", \"notas\": [" + grades + "]" +
           ", \"notaFinal\": " + (e.getFinalGrade() == -1 ? "null" : number(e.getFinalGrade())) +
           ", \"aulas\": " + to_string(e.getClasses()) +
           ", \"presencas\": " + to_string(e.getPresences()) +
           ", \"media\": " + number(e.calculateAverage()) +
           ", \"frequencia\": " + number(e.calculateAttendance()) +
           ", \"situacao\": " + text(g.getStatus(&e)) +            // "Cursando" se a turma está aberta
           ", \"previsao\": " + text(e.calculateStatus()) + "}";   // polimorfismo: regra normal ou com final
}

string groupJson(ClassGroup& g) {
    string enrollments = "";
    for (Enrollment* e : g.getEnrollments()) {
        if (enrollments != "") enrollments += ", ";
        enrollments += enrollmentJson(g, *e);
    }
    string teacher = g.getTeacher() != nullptr ? text(g.getTeacher()->getMatriculaFuncional()) : "null";
    return "{\"codigo\": " + text(g.getCode()) + ", \"disciplina\": " + text(g.getDiscipline()->getCode()) +
           ", \"professor\": " + teacher + ", \"semestre\": " + text(g.getSemester()) +
           ", \"horario\": " + text(g.getSchedule()) + ", \"vagas\": " + to_string(g.getCapacity()) +
           ", \"encerrada\": " + jsonBool(g.isFinished()) + ", \"matriculas\": [" + enrollments + "]}";
}

// Tudo de uma vez: o React pede isso ao abrir e depois de cada mudança
string allJson() {
    string students = "", teachers = "", disciplines = "", groups = "";
    for (Student* s : school.students) students += (students == "" ? "" : ", ") + studentJson(*s);
    for (Teacher* t : school.teachers) teachers += (teachers == "" ? "" : ", ") + teacherJson(*t);
    for (Discipline* d : school.disciplines) disciplines += (disciplines == "" ? "" : ", ") + disciplineJson(*d);
    for (ClassGroup* g : school.groups) groups += (groups == "" ? "" : ", ") + groupJson(*g);
    return "{\"alunos\": [" + students + "], \"professores\": [" + teachers + "], \"disciplinas\": [" +
           disciplines + "], \"turmas\": [" + groups + "]}";
}

// ─────────────────────────── Respostas ───────────────────────────

// Deu certo: devolve a mensagem e os dados atualizados
void ok(Response& res, string message) {
    res.set_content("{\"mensagem\": " + text(message) + ", \"dados\": " + allJson() + "}", "application/json");
}

// Deu errado: devolve o erro (status 400) e o React mostra para o usuário
void fail(Response& res, string message) {
    res.status = 400;
    res.set_content("{\"erro\": " + text(message) + "}", "application/json");
}

// Lê um campo enviado pelo React (ex: param(req, "nome"))
string param(const Request& req, string name) {
    return req.get_param_value(name);
}

// Texto vazio ou com apóstrofo (o ' quebra o SQL dos repositórios)
bool invalidText(string s) {
    return s == "" || s.find('\'') != string::npos;
}

// Converte texto em número. Devolve -1 se não for um número
double toNumber(string s) {
    try {
        return stod(s);
    } catch (...) {
        return -1;
    }
}

// Tira um ponteiro de uma lista (usado ao remover)
template <typename T>
void eraseFrom(vector<T*>& list, T* item) {
    for (int i = 0; i < list.size(); i++) {
        if (list[i] == item) {
            list.erase(list.begin() + i);
            return;
        }
    }
}

// ─────────────────────────── Rotas ───────────────────────────
// Cada rota é um endereço. GET = só lê. POST = muda alguma coisa.

void addRoutes(Server& server) {

    // Lê tudo
    server.Get("/api/dados", [](const Request& req, Response& res) {
        res.set_content(allJson(), "application/json");
    });

    // ── Alunos ──────────────────────────────────────────────────
    server.Post("/api/alunos/criar", [](const Request& req, Response& res) {
        string matricula = param(req, "matricula");
        if (invalidText(matricula) || invalidText(param(req, "nome")) || invalidText(param(req, "curso"))) {
            return fail(res, "Preencha matrícula, nome e curso (sem apóstrofo).");
        }
        if (findStudent(school, matricula) != nullptr || findTeacher(school, matricula) != nullptr) {
            return fail(res, "Já existe uma pessoa com a matrícula " + matricula + ".");
        }
        Student* s = new Student(param(req, "nome"), param(req, "nascimento"), param(req, "cpf"),
                                 matricula, param(req, "curso"));
        s->setContato(param(req, "contato"));
        school.students.push_back(s);
        StudentRepository repo;
        repo.insert(*s);
        ok(res, "Aluno " + s->getName() + " cadastrado.");
    });

    server.Post("/api/alunos/editar", [](const Request& req, Response& res) {
        Student* s = findStudent(school, param(req, "matricula"));
        if (s == nullptr) return fail(res, "Aluno não encontrado.");
        if (invalidText(param(req, "nome")) || invalidText(param(req, "curso"))) {
            return fail(res, "Nome e curso são obrigatórios (sem apóstrofo).");
        }
        s->setName(param(req, "nome"));
        s->setCurso(param(req, "curso"));
        s->setContato(param(req, "contato"));
        StudentRepository repo;
        repo.update(*s);
        ok(res, "Dados de " + s->getName() + " atualizados.");
    });

    server.Post("/api/alunos/remover", [](const Request& req, Response& res) {
        Student* s = findStudent(school, param(req, "matricula"));
        if (s == nullptr) return fail(res, "Aluno não encontrado.");
        // Tira o aluno de todas as turmas antes de apagar
        EnrollmentRepository enrollmentRepo;
        for (ClassGroup* g : school.groups) {
            if (g->findEnrollment(*s) != nullptr) {
                enrollmentRepo.remove(*g, *s);
                g->unenroll(*s);
            }
        }
        StudentRepository repo;
        repo.remove(s->getMatricula());
        string name = s->getName();
        eraseFrom(school.students, s);
        delete s;
        ok(res, "Aluno " + name + " removido.");
    });

    // ── Professores ─────────────────────────────────────────────
    server.Post("/api/professores/criar", [](const Request& req, Response& res) {
        string matricula = param(req, "matricula");
        if (invalidText(matricula) || invalidText(param(req, "nome"))) {
            return fail(res, "Preencha matrícula e nome (sem apóstrofo).");
        }
        if (findStudent(school, matricula) != nullptr || findTeacher(school, matricula) != nullptr) {
            return fail(res, "Já existe uma pessoa com a matrícula " + matricula + ".");
        }
        Teacher* t = new Teacher(param(req, "nome"), param(req, "nascimento"), param(req, "cpf"), matricula);
        t->setContato(param(req, "contato"));
        school.teachers.push_back(t);
        TeacherRepository repo;
        repo.insert(*t);
        ok(res, "Professor " + t->getName() + " cadastrado.");
    });

    server.Post("/api/professores/editar", [](const Request& req, Response& res) {
        Teacher* t = findTeacher(school, param(req, "matricula"));
        if (t == nullptr) return fail(res, "Professor não encontrado.");
        if (invalidText(param(req, "nome"))) return fail(res, "O nome é obrigatório (sem apóstrofo).");
        t->setName(param(req, "nome"));
        t->setContato(param(req, "contato"));
        TeacherRepository repo;
        repo.update(*t);
        ok(res, "Dados de " + t->getName() + " atualizados.");
    });

    server.Post("/api/professores/remover", [](const Request& req, Response& res) {
        Teacher* t = findTeacher(school, param(req, "matricula"));
        if (t == nullptr) return fail(res, "Professor não encontrado.");
        // Prevenção de erro: não apaga professor que ainda tem turma ou disciplina
        for (ClassGroup* g : school.groups) {
            if (g->getTeacher() == t) return fail(res, t->getName() + " ainda dá aula na turma " + g->getCode() + ".");
        }
        if (t->getDisciplinas().size() > 0) {
            return fail(res, t->getName() + " ainda é responsável por " + t->getDisciplinas()[0] + ".");
        }
        TeacherRepository repo;
        repo.remove(t->getMatriculaFuncional());
        string name = t->getName();
        eraseFrom(school.teachers, t);
        delete t;
        ok(res, "Professor " + name + " removido.");
    });

    // ── Disciplinas ─────────────────────────────────────────────
    server.Post("/api/disciplinas/criar", [](const Request& req, Response& res) {
        string code = param(req, "codigo");
        double workload = toNumber(param(req, "cargaHoraria"));
        if (invalidText(code) || invalidText(param(req, "nome")) || workload <= 0) {
            return fail(res, "Preencha código, nome e uma carga horária maior que zero.");
        }
        if (findDiscipline(school, code) != nullptr) return fail(res, "Já existe a disciplina " + code + ".");

        Discipline* d = new Discipline(code, param(req, "nome"), (int)workload, param(req, "ementa"),
                                       param(req, "temFinal") == "true");
        Teacher* t = findTeacher(school, param(req, "professor"));
        d->setTeacher(t);
        if (t != nullptr) t->addDisciplina(code);
        school.disciplines.push_back(d);
        DisciplineRepository repo;
        repo.insert(*d);
        ok(res, "Disciplina " + code + " cadastrada.");
    });

    server.Post("/api/disciplinas/editar", [](const Request& req, Response& res) {
        Discipline* d = findDiscipline(school, param(req, "codigo"));
        if (d == nullptr) return fail(res, "Disciplina não encontrada.");
        double workload = toNumber(param(req, "cargaHoraria"));
        if (invalidText(param(req, "nome")) || workload <= 0) {
            return fail(res, "Nome e carga horária são obrigatórios.");
        }
        d->setName(param(req, "nome"));
        d->setSyllabus(param(req, "ementa"));
        d->setWorkload((int)workload);
        // Troca o professor responsável
        if (d->getTeacher() != nullptr) d->getTeacher()->removeDisciplina(d->getCode());
        Teacher* t = findTeacher(school, param(req, "professor"));
        d->setTeacher(t);
        if (t != nullptr) t->addDisciplina(d->getCode());
        DisciplineRepository repo;
        repo.update(*d);
        ok(res, "Disciplina " + d->getCode() + " atualizada.");
    });

    server.Post("/api/disciplinas/remover", [](const Request& req, Response& res) {
        Discipline* d = findDiscipline(school, param(req, "codigo"));
        if (d == nullptr) return fail(res, "Disciplina não encontrada.");
        for (ClassGroup* g : school.groups) {
            if (g->getDiscipline() == d) return fail(res, "A disciplina tem a turma " + g->getCode() + ". Remova a turma antes.");
        }
        if (d->getTeacher() != nullptr) d->getTeacher()->removeDisciplina(d->getCode());
        DisciplineRepository repo;
        repo.remove(d->getCode());
        string code = d->getCode();
        eraseFrom(school.disciplines, d);
        delete d;
        ok(res, "Disciplina " + code + " removida.");
    });

    // ── Turmas ──────────────────────────────────────────────────
    server.Post("/api/turmas/criar", [](const Request& req, Response& res) {
        Discipline* d = findDiscipline(school, param(req, "disciplina"));
        string code = param(req, "codigo");
        double capacity = toNumber(param(req, "vagas"));
        if (d == nullptr) return fail(res, "Escolha uma disciplina.");
        if (invalidText(code) || invalidText(param(req, "semestre")) || invalidText(param(req, "horario"))) {
            return fail(res, "Preencha código, semestre e horário.");
        }
        if (capacity < 1) return fail(res, "A turma precisa ter pelo menos 1 vaga.");
        if (findGroup(school, code) != nullptr) return fail(res, "Já existe a turma " + code + ".");

        ClassGroup* g = new ClassGroup(code, d, findTeacher(school, param(req, "professor")),
                                       param(req, "semestre"), param(req, "horario"), (int)capacity);
        school.groups.push_back(g);
        ClassGroupRepository repo;
        repo.insert(*g);
        ok(res, "Turma " + code + " criada.");
    });

    server.Post("/api/turmas/encerrar", [](const Request& req, Response& res) {
        ClassGroup* g = findGroup(school, param(req, "turma"));
        if (g == nullptr) return fail(res, "Turma não encontrada.");
        g->finish();
        ClassGroupRepository repo;
        repo.update(*g);
        ok(res, "Turma " + g->getCode() + " encerrada. A situação final foi calculada.");
    });

    server.Post("/api/turmas/remover", [](const Request& req, Response& res) {
        ClassGroup* g = findGroup(school, param(req, "turma"));
        if (g == nullptr) return fail(res, "Turma não encontrada.");
        EnrollmentRepository enrollmentRepo;
        for (Enrollment* e : g->getEnrollments()) {
            enrollmentRepo.remove(*g, *e->getStudent());
        }
        ClassGroupRepository repo;
        repo.remove(g->getCode());
        string code = g->getCode();
        eraseFrom(school.groups, g);
        delete g;   // o destrutor de ClassGroup apaga as matrículas
        ok(res, "Turma " + code + " removida.");
    });

    // ── Matrículas ──────────────────────────────────────────────
    server.Post("/api/matriculas/criar", [](const Request& req, Response& res) {
        ClassGroup* g = findGroup(school, param(req, "turma"));
        Student* s = findStudent(school, param(req, "aluno"));
        if (g == nullptr || s == nullptr) return fail(res, "Escolha a turma e o aluno.");
        // As mesmas regras de ClassGroup::enroll, com mensagens claras
        if (g->isFinished()) return fail(res, "A turma " + g->getCode() + " está encerrada.");
        if (g->findEnrollment(*s) != nullptr) return fail(res, s->getName() + " já está nesta turma.");
        if (g->getEnrollments().size() >= g->getCapacity()) return fail(res, "A turma está lotada.");

        g->enroll(*s);
        EnrollmentRepository repo;
        repo.save(*g, *g->findEnrollment(*s));
        ok(res, s->getName() + " matriculado(a) em " + g->getCode() + ".");
    });

    server.Post("/api/matriculas/remover", [](const Request& req, Response& res) {
        ClassGroup* g = findGroup(school, param(req, "turma"));
        Student* s = findStudent(school, param(req, "aluno"));
        if (g == nullptr || s == nullptr || g->findEnrollment(*s) == nullptr) {
            return fail(res, "Matrícula não encontrada.");
        }
        EnrollmentRepository repo;
        repo.remove(*g, *s);
        g->unenroll(*s);
        ok(res, s->getName() + " saiu da turma " + g->getCode() + ".");
    });

    // ── Notas e frequência ──────────────────────────────────────
    // Lança uma nota nova (indice vazio) ou corrige a nota da posição "indice"
    server.Post("/api/notas", [](const Request& req, Response& res) {
        ClassGroup* g = findGroup(school, param(req, "turma"));
        Student* s = findStudent(school, param(req, "aluno"));
        if (g == nullptr || s == nullptr || g->findEnrollment(*s) == nullptr) {
            return fail(res, "Matrícula não encontrada.");
        }
        if (g->isFinished()) return fail(res, "A turma está encerrada: as notas não podem mudar.");
        double grade = toNumber(param(req, "nota"));
        if (grade < 0 || grade > 10) return fail(res, "A nota precisa ser de 0 a 10.");

        Enrollment* e = g->findEnrollment(*s);
        if (param(req, "indice") == "") {
            e->addGrade(grade);
        } else {
            e->setGrade((int)toNumber(param(req, "indice")), grade);
        }
        EnrollmentRepository repo;
        repo.save(*g, *e);
        ok(res, "Nota de " + s->getName() + " salva.");
    });

    // Prova final
    server.Post("/api/final", [](const Request& req, Response& res) {
        ClassGroup* g = findGroup(school, param(req, "turma"));
        Student* s = findStudent(school, param(req, "aluno"));
        if (g == nullptr || s == nullptr || g->findEnrollment(*s) == nullptr) {
            return fail(res, "Matrícula não encontrada.");
        }
        if (!g->getDiscipline()->getHasFinalExam()) return fail(res, "Esta disciplina não tem prova final.");
        double grade = toNumber(param(req, "nota"));
        if (grade < 0 || grade > 10) return fail(res, "A nota precisa ser de 0 a 10.");

        Enrollment* e = g->findEnrollment(*s);
        e->setFinalGrade(grade);
        EnrollmentRepository repo;
        repo.save(*g, *e);
        ok(res, "Prova final de " + s->getName() + " salva.");
    });

    // Chamada: "presentes" é a lista de matrículas separadas por vírgula
    server.Post("/api/chamada", [](const Request& req, Response& res) {
        ClassGroup* g = findGroup(school, param(req, "turma"));
        if (g == nullptr) return fail(res, "Turma não encontrada.");
        if (g->isFinished()) return fail(res, "A turma está encerrada.");

        string present = "," + param(req, "presentes") + ",";
        int count = 0;
        for (Enrollment* e : g->getEnrollments()) {
            bool isPresent = present.find("," + e->getStudent()->getMatricula() + ",") != string::npos;
            e->addAttendance(isPresent);
            if (isPresent) count++;
        }
        EnrollmentRepository repo;
        repo.saveAll(*g);
        ok(res, "Chamada salva: " + to_string(count) + " presente(s), " +
                to_string(g->getEnrollments().size() - count) + " falta(s).");
    });
}

// ─────────────────────────── main ───────────────────────────

int main() {
    Database& db = Database::getInstance();
    if (!db.open("data/escola.db")) return 1;
    db.createTables();
    seedDatabase();
    loadData(school);

    Server server;
    // Atende um pedido por vez (assim dois pedidos nunca mexem nos dados juntos)
    server.new_task_queue = [] { return new ThreadPool(1); };

    addRoutes(server);
    // Entrega as telas do React já compiladas (pasta web/dist)
    server.set_mount_point("/", "./web/dist");

    cout << "Servidor ligado. Abra no navegador: http://localhost:8080" << endl;
    cout << "Para desligar: Ctrl+C" << endl;
    server.listen("0.0.0.0", 8080);

    freeData(school);
    db.close();
    return 0;
}
