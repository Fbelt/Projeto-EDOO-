#include <iostream>
#include "Seed.h"
#include "Database.h"
#include "StudentRepository.h"
#include "TeacherRepository.h"
#include "DisciplineRepository.h"
#include "ClassGroupRepository.h"
#include "EnrollmentRepository.h"

using namespace std;

// Diz se o banco ainda não tem ninguém cadastrado
bool isDatabaseEmpty() {
    vector<vector<string>> rows = Database::getInstance().query("SELECT * FROM pessoas;");
    return rows.size() == 0;
}

// Lança notas e presenças de um aluno numa turma.
// presences de classes aulas (ex: 9 de 10)
void addResults(ClassGroup& group, Student& s, double g1, double g2, int presences, int classes) {
    Enrollment* e = group.findEnrollment(s);
    e->addGrade(g1);
    e->addGrade(g2);
    for (int i = 0; i < classes; i++) {
        e->addAttendance(i < presences);
    }
}

// Cria os objetos de exemplo e salva tudo usando os repositórios
void seedDatabase() {
    if (!isDatabaseEmpty()) {
        return;  // já tem dados, não faz nada
    }
    cout << "Banco vazio: criando dados de exemplo..." << endl;

    // Professores
    Teacher ana("Ana Souza", "1980-04-10", "111.111.111-11", "P001");
    ana.setContato("ana@cin.ufpe.br");
    Teacher carlos("Carlos Lima", "1975-09-22", "222.222.222-22", "P002");
    carlos.setContato("carlos@cin.ufpe.br");

    // Alunos
    Student joao("Joao Silva", "2005-03-15", "333.333.333-33", "2024001", "Ciencia da Computacao");
    joao.setContato("joao@ufpe.br");
    Student maria("Maria Oliveira", "2004-11-02", "444.444.444-44", "2024002", "Engenharia da Computacao");
    maria.setContato("maria@ufpe.br");
    Student pedro("Pedro Santos", "2005-07-30", "555.555.555-55", "2024003", "Sistemas de Informacao");
    pedro.setContato("pedro@ufpe.br");
    Student julia("Julia Costa", "2006-01-18", "666.666.666-66", "2024004", "Ciencia da Computacao");
    julia.setContato("julia@ufpe.br");

    // Disciplinas (IP não tem prova final, EDOO tem)
    Discipline ip("CIN0130", "Introducao a Programacao", 60, "Logica e algoritmos", false);
    ip.setTeacher(&carlos);
    Discipline edoo("CIN0135", "Estruturas de Dados Orientadas a Objetos", 60, "Classes, heranca e polimorfismo", true);
    edoo.setTeacher(&ana);

    // Turmas: IP do semestre passado (já encerrada) e EDOO do semestre atual
    ClassGroup ipGroup("IP-2026.1", &ip, &carlos, "2026.1", "SEG 8h-10h", 30);
    ClassGroup edooGroup("EDOO-2026.2", &edoo, &ana, "2026.2", "TER 10h-12h", 3);

    ipGroup.enroll(joao);
    ipGroup.enroll(maria);
    ipGroup.enroll(pedro);
    addResults(ipGroup, joao, 8, 9, 10, 10);   // aprovado
    addResults(ipGroup, maria, 9, 8, 6, 10);   // reprovado por falta
    addResults(ipGroup, pedro, 5, 4, 9, 10);   // reprovado por nota
    ipGroup.finish();

    edooGroup.enroll(joao);
    edooGroup.enroll(maria);
    edooGroup.enroll(julia);
    addResults(edooGroup, joao, 7.5, 6, 5, 6);
    addResults(edooGroup, maria, 4, 5, 6, 6);
    addResults(edooGroup, julia, 9, 10, 6, 6);

    // Salva tudo no banco
    TeacherRepository teacherRepo;
    teacherRepo.insert(ana);
    teacherRepo.insert(carlos);

    StudentRepository studentRepo;
    studentRepo.insert(joao);
    studentRepo.insert(maria);
    studentRepo.insert(pedro);
    studentRepo.insert(julia);

    DisciplineRepository disciplineRepo;
    disciplineRepo.insert(ip);
    disciplineRepo.insert(edoo);

    ClassGroupRepository groupRepo;
    groupRepo.insert(ipGroup);
    groupRepo.insert(edooGroup);

    EnrollmentRepository enrollmentRepo;
    enrollmentRepo.saveAll(ipGroup);
    enrollmentRepo.saveAll(edooGroup);
}
