#ifndef DISCIPLINE_H
#define DISCIPLINE_H

#include <string>

using namespace std;

class Teacher;

// Disciplina do catálogo (ex: CIN0135 - EDOO).
class Discipline {
private:
    string code;
    string name;
    int workload;        // carga horária em horas
    string syllabus;     // ementa
    Teacher* teacher;    // professor responsável
    bool hasFinalExam;   // true = matrículas desta disciplina têm prova final

public:
    // Cria a disciplina.
    Discipline(string code, string name, int workload, string syllabus, bool hasFinalExam = false);

    string getCode() const;
    string getName() const;
    int getWorkload() const;
    string getSyllabus() const;
    Teacher* getTeacher() const;
    bool getHasFinalExam() const;

    void setName(string name);
    // Lança exceção se a carga horária for negativa.
    void setWorkload(int workload);
    void setSyllabus(string syllabus);
    void setTeacher(Teacher* teacher);
};

#endif
