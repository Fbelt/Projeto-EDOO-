#include "FinalExamEnrollment.h"

using namespace std;

// Construtor: usa o construtor de Enrollment
FinalExamEnrollment::FinalExamEnrollment(Student& s) : Enrollment(s) {}

// Regra com final:
string FinalExamEnrollment::calculateStatus() {
    if (calculateAttendance() < 75) {
        return "Reprovado por falta";
    }

    double average = calculateAverage();
    if (average >= 7) {
        return "Aprovado";
    }
    if (average < 3) {
        return "Reprovado por nota";
    }
    if (getFinalGrade() == -1) {
        return "Em prova final";
    }
    if ((average + getFinalGrade()) / 2 >= 5) {
        return "Aprovado";
    }
    return "Reprovado por nota";
}
