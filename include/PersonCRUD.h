#ifndef PERSONCRUD_H
#define PERSONCRUD_H

#include <string>
#include <vector>
#include "Student.h"
#include "Teacher.h"

using namespace std;

// Cadastro de alunos e professores (para o Integrante 3 integrar com o banco)
// Guarda ponteiros — não copie os objetos, pois Enrollment usa o endereço dos alunos
class PersonCRUD {
private:
    vector<Student*> alunos;
    vector<Teacher*> professores;

public:
    ~PersonCRUD(); // libera a memória dos ponteiros

    // ── Alunos ──────────────────────────────────────────────────────
    void adicionarAluno(const string& nome, const string& nascimento,
                        const string& cpf, const string& matricula, const string& curso);
    Student* buscarAluno(const string& matricula);
    bool removerAluno(const string& matricula);
    void listarAlunos() const;
    vector<Student*>& getAlunos();

    // ── Professores ─────────────────────────────────────────────────
    void adicionarProfessor(const string& nome, const string& nascimento,
                            const string& cpf, const string& matricula);
    Teacher* buscarProfessor(const string& matricula);
    bool removerProfessor(const string& matricula);
    void listarProfessores() const;
    vector<Teacher*>& getProfessores();
};

#endif
