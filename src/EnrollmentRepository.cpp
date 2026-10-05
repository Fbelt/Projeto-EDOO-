#include "EnrollmentRepository.h"
#include "Database.h"

using namespace std;

// Salva a matrícula. Para não complicar, apaga o que já existia
// e grava tudo de novo a partir do objeto.
void EnrollmentRepository::save(ClassGroup& group, Enrollment& e) {
    remove(group, *e.getStudent());

    Database& db = Database::getInstance();
    string student = e.getStudent()->getMatricula();
    string turma = group.getCode();

    db.execute("INSERT INTO matriculas VALUES ('" + student + "', '" + turma + "', " +
               to_string(e.getFinalGrade()) + ");");

    for (double grade : e.getGrades()) {
        db.execute("INSERT INTO notas VALUES ('" + student + "', '" + turma + "', " +
                   to_string(grade) + ");");
    }

    db.execute("INSERT INTO frequencia VALUES ('" + student + "', '" + turma + "', " +
               to_string(e.getClasses()) + ", " + to_string(e.getPresences()) + ");");
}

// Salva todas as matrículas da turma
void EnrollmentRepository::saveAll(ClassGroup& group) {
    for (Enrollment* e : group.getEnrollments()) {
        save(group, *e);
    }
}

// Apaga a matrícula do aluno na turma, junto com as notas e a frequência
void EnrollmentRepository::remove(ClassGroup& group, Student& s) {
    Database& db = Database::getInstance();
    string where = " WHERE aluno = '" + s.getMatricula() + "' AND turma = '" + group.getCode() + "';";
    db.execute("DELETE FROM matriculas" + where);
    db.execute("DELETE FROM notas" + where);
    db.execute("DELETE FROM frequencia" + where);
}

// Lê os alunos da turma no banco e matricula eles de novo,
// repondo as notas e a frequência salvas
void EnrollmentRepository::loadInto(ClassGroup& group, vector<Student*>& students) {
    Database& db = Database::getInstance();
    vector<vector<string>> rows = db.query(
        "SELECT aluno, nota_final FROM matriculas WHERE turma = '" + group.getCode() + "';");

    for (vector<string> row : rows) {
        // Procura o aluno na lista pela matrícula
        for (Student* s : students) {
            if (s->getMatricula() == row[0]) {
                group.enroll(*s);
                Enrollment* e = group.findEnrollment(*s);
                string where = " WHERE aluno = '" + row[0] + "' AND turma = '" + group.getCode() + "'";

                // Notas (stod transforma texto em número decimal: "8.5" vira 8.5)
                vector<vector<string>> grades = db.query("SELECT valor FROM notas" + where + ";");
                for (vector<string> grade : grades) {
                    e->addGrade(stod(grade[0]));
                }

                // Frequência: registra as aulas de novo (presenças primeiro, depois faltas)
                vector<vector<string>> attendance = db.query("SELECT aulas, presencas FROM frequencia" + where + ";");
                if (attendance.size() > 0) {
                    int classes = stoi(attendance[0][0]);
                    int presences = stoi(attendance[0][1]);
                    for (int i = 0; i < classes; i++) {
                        e->addAttendance(i < presences);
                    }
                }

                // Nota da prova final (-1 = não fez)
                if (stod(row[1]) != -1) {
                    e->setFinalGrade(stod(row[1]));
                }
            }
        }
    }
}
