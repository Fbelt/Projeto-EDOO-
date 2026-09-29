#ifndef CLASSGROUP_H
#define CLASSGROUP_H

#include <memory>
#include <string>
#include <vector>

#include "Enrollment.h"

using namespace std;

class Discipline;
class Teacher;
class Student;

// Turma: uma oferta da disciplina em um semestre.
// A turma é dona das matrículas (unique_ptr apaga sozinho). Alunos, professor
// e disciplina NÃO são da turma, ela só aponta para eles.
class ClassGroup {
private:
    string code;             // ex: "CIN0135-2026.2-A"
    Discipline* discipline;
    Teacher* teacher;
    string semester;         // ex: "2026.2"
    string schedule;         // ex: "SEG 08-10; QUA 08-10"
    int capacity;            // limite de vagas
    bool finished;           // true quando o semestre acabou
    vector<unique_ptr<Enrollment>> enrollments;

public:
    // Cria a turma.
    ClassGroup(string code, Discipline& discipline, Teacher* teacher,
               string semester, string schedule, int capacity);

    string getCode() const;
    Discipline& getDiscipline() const;
    Teacher* getTeacher() const;
    string getSemester() const;
    string getSchedule() const;
    int getCapacity() const;
    bool isFinished() const;
    // Lista de matrículas da turma.
    vector<Enrollment*> getEnrollments() const;

    // Encerra o semestre: as situações passam a ser aprovado/reprovado.
    void finish();

    // Matricula o aluno. Lança exceção se não tiver vaga, se ele já estiver na turma
    // ou se a turma estiver encerrada.
    Enrollment& enroll(Student& student);
    // Tira o aluno da turma. Retorna false se ele não estava nela.
    bool unenroll(Student& student);
    // Procura a matrícula do aluno (nullptr se não achar).
    Enrollment* findEnrollment(Student& student) const;

    // Imprime alunos, médias, situação, média da turma e taxa de aprovação.
    void printReport() const;
};

// Imprime o histórico do aluno percorrendo todas as turmas do sistema.
void printTranscript(Student& student, const vector<ClassGroup*>& allGroups);

#endif
