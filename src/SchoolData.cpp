#include "SchoolData.h"
#include "StudentRepository.h"
#include "TeacherRepository.h"
#include "DisciplineRepository.h"
#include "ClassGroupRepository.h"

using namespace std;

// Carrega tudo do banco para a memória.
// A ordem importa: turmas precisam dos alunos, professores e disciplinas
void loadData(SchoolData& data) {
    StudentRepository studentRepo;
    TeacherRepository teacherRepo;
    DisciplineRepository disciplineRepo;
    ClassGroupRepository groupRepo;

    data.students = studentRepo.findByName("");   // "" = todos
    data.teachers = teacherRepo.findByName("");
    data.disciplines = disciplineRepo.findByName("", data.teachers);
    data.groups = groupRepo.findAll(data.disciplines, data.teachers, data.students);

    // Cada professor fica sabendo quais disciplinas ele leciona
    for (Discipline* d : data.disciplines) {
        if (d->getTeacher() != nullptr) {
            d->getTeacher()->addDisciplina(d->getCode());
        }
    }
}

// Libera a memória de todos os objetos
void freeData(SchoolData& data) {
    for (ClassGroup* g : data.groups) delete g;
    for (Discipline* d : data.disciplines) delete d;
    for (Teacher* t : data.teachers) delete t;
    for (Student* s : data.students) delete s;
}

// Procura o aluno pela matrícula
Student* findStudent(SchoolData& data, string matricula) {
    for (Student* s : data.students) {
        if (s->getMatricula() == matricula) return s;
    }
    return nullptr;
}

// Procura o professor pela matrícula funcional
Teacher* findTeacher(SchoolData& data, string matricula) {
    for (Teacher* t : data.teachers) {
        if (t->getMatriculaFuncional() == matricula) return t;
    }
    return nullptr;
}

// Procura a disciplina pelo código
Discipline* findDiscipline(SchoolData& data, string code) {
    for (Discipline* d : data.disciplines) {
        if (d->getCode() == code) return d;
    }
    return nullptr;
}

// Procura a turma pelo código
ClassGroup* findGroup(SchoolData& data, string code) {
    for (ClassGroup* g : data.groups) {
        if (g->getCode() == code) return g;
    }
    return nullptr;
}

// Deixa o texto todo em minúsculo (só letras sem acento)
string toLower(string s) {
    for (char& c : s) {
        if (c >= 'A' && c <= 'Z') c = c - 'A' + 'a';
    }
    return s;
}

// Busca sem diferenciar maiúscula/minúscula: "jo" acha "Joao"
bool containsIgnoreCase(string text, string piece) {
    return toLower(text).find(toLower(piece)) != string::npos;
}
