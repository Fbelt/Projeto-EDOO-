#include <iostream>
#include <vector>
#include "Database.h"
#include "Seed.h"
#include "StudentRepository.h"
#include "TeacherRepository.h"
#include "DisciplineRepository.h"
#include "ClassGroupRepository.h"

using namespace std;

// main mínimo: abre o banco, cria as tabelas, coloca os dados de exemplo
// e mostra as turmas. O menu de verdade é feito pelo Integrante 4.
int main() {
    Database& db = Database::getInstance();
    if (!db.open("data/escola.db")) {
        return 1;
    }
    db.createTables();
    seedDatabase();

    // Carrega tudo do banco para a memória.
    // A ordem importa: turmas precisam dos alunos, professores e disciplinas
    StudentRepository studentRepo;
    TeacherRepository teacherRepo;
    DisciplineRepository disciplineRepo;
    ClassGroupRepository groupRepo;

    vector<Student*> students = studentRepo.findByName("");
    vector<Teacher*> teachers = teacherRepo.findByName("");
    vector<Discipline*> disciplines = disciplineRepo.findByName("", teachers);
    vector<ClassGroup*> groups = groupRepo.findAll(disciplines, teachers, students);

    cout << students.size() << " alunos, " << teachers.size() << " professores, "
         << disciplines.size() << " disciplinas, " << groups.size() << " turmas" << endl;

    for (ClassGroup* g : groups) {
        cout << endl;
        g->printReport();
    }

    // Libera a memória (turmas primeiro, porque elas apontam para os outros)
    for (ClassGroup* g : groups) delete g;
    for (Discipline* d : disciplines) delete d;
    for (Teacher* t : teachers) delete t;
    for (Student* s : students) delete s;

    db.close();
    return 0;
}
