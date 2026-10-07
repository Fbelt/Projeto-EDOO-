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

// Matricula o aluno na turma e já lança duas notas e as presenças.
// presences de classes aulas 
void addResults(ClassGroup& group, Student& s, double g1, double g2, int presences, int classes) {
    group.enroll(s);
    Enrollment* e = group.findEnrollment(s);
    e->addGrade(g1);
    e->addGrade(g2);
    for (int i = 0; i < classes; i++) {
        e->addAttendance(i < presences);
    }
}

// Matricula o aluno numa turma que ainda não começou 
void addEmpty(ClassGroup& group, Student& s) {
    group.enroll(s);
}

// Cria os objetos de exemplo e salva tudo usando os repositórios
void seedDatabase() {
    if (!isDatabaseEmpty()) {
        return;  
    }
    cout << "Banco vazio: criando dados de exemplo..." << endl;

    // Professores 
    Teacher ana("Ana Souza", "1980-04-10", "111.111.111-11", "P001");
    ana.setContato("ana@cin.ufpe.br");
    Teacher carlos("Carlos Lima", "1975-09-22", "222.222.222-22", "P002");
    carlos.setContato("carlos@cin.ufpe.br");
    Teacher beatriz("Beatriz Nogueira", "1983-02-14", "777.777.777-77", "P003");
    beatriz.setContato("beatriz@cin.ufpe.br");
    Teacher rafael("Rafael Menezes", "1978-12-03", "888.888.888-88", "P004");
    rafael.setContato("rafael@cin.ufpe.br");
    Teacher helena("Helena Duarte", "1986-06-27", "999.999.999-99", "P005");
    helena.setContato("helena@cin.ufpe.br");
    Teacher tiago("Tiago Barros", "1990-08-09", "123.456.789-00", "P006");
    tiago.setContato("tiago@cin.ufpe.br");

    // Alunos 
    Student joao("Joao Silva", "2005-03-15", "333.333.333-33", "2024001", "Ciencia da Computacao");
    joao.setContato("joao@ufpe.br");
    Student maria("Maria Oliveira", "2004-11-02", "444.444.444-44", "2024002", "Engenharia da Computacao");
    maria.setContato("maria@ufpe.br");
    Student pedro("Pedro Santos", "2005-07-30", "555.555.555-55", "2024003", "Sistemas de Informacao");
    pedro.setContato("pedro@ufpe.br");
    Student julia("Julia Costa", "2006-01-18", "666.666.666-66", "2024004", "Ciencia da Computacao");
    julia.setContato("julia@ufpe.br");
    Student lucas("Lucas Almeida", "2005-05-21", "100.100.100-10", "2024005", "Ciencia da Computacao");
    lucas.setContato("lucas@ufpe.br");
    Student beatrizF("Beatriz Ferreira", "2004-09-12", "200.200.200-20", "2024006", "Sistemas de Informacao");
    beatrizF.setContato("beatrizf@ufpe.br");
    Student gabriel("Gabriel Rocha", "2005-01-05", "300.300.300-30", "2024007", "Engenharia da Computacao");
    gabriel.setContato("gabriel@ufpe.br");
    Student larissa("Larissa Mendes", "2005-10-26", "400.400.400-40", "2024008", "Ciencia da Computacao");
    larissa.setContato("larissa@ufpe.br");
    Student mateus("Mateus Carvalho", "2004-04-08", "500.500.500-50", "2024009", "Sistemas de Informacao");
    mateus.setContato("mateus@ufpe.br");
    Student camila("Camila Ribeiro", "2005-12-30", "600.600.600-60", "2024010", "Engenharia da Computacao");
    camila.setContato("camila@ufpe.br");
    Student felipe("Felipe Araujo", "2006-03-03", "700.700.700-70", "2025001", "Ciencia da Computacao");
    felipe.setContato("felipe@ufpe.br");
    Student isabela("Isabela Martins", "2006-07-19", "800.800.800-80", "2025002", "Sistemas de Informacao");
    isabela.setContato("isabela@ufpe.br");
    Student rodrigo("Rodrigo Pereira", "2006-02-11", "900.900.900-90", "2025003", "Ciencia da Computacao");
    rodrigo.setContato("rodrigo@ufpe.br");
    Student amanda("Amanda Lopes", "2006-09-23", "101.101.101-11", "2025004", "Engenharia da Computacao");
    amanda.setContato("amanda@ufpe.br");
    Student thiago("Thiago Gomes", "2006-11-14", "202.202.202-22", "2025005", "Sistemas de Informacao");
    thiago.setContato("thiago@ufpe.br");
    Student sofia("Sofia Barbosa", "2007-01-29", "303.303.303-33", "2025006", "Ciencia da Computacao");
    sofia.setContato("sofia@ufpe.br");

    // Disciplinas 
    Discipline ip("CIN0130", "Introducao a Programacao", 60, "Logica e algoritmos", false);
    ip.setTeacher(&carlos);
    Discipline edoo("CIN0135", "Estruturas de Dados Orientadas a Objetos", 60, "Classes, heranca e polimorfismo", true);
    edoo.setTeacher(&ana);
    Discipline ed("CIN0137", "Estruturas de Dados", 60, "Listas, pilhas, filas e arvores", true);
    ed.setTeacher(&rafael);
    Discipline bd("CIN0140", "Banco de Dados", 60, "Modelo relacional e SQL", true);
    bd.setTeacher(&beatriz);
    Discipline redes("CIN0142", "Redes de Computadores", 60, "Protocolos e camadas de rede", false);
    redes.setTeacher(&carlos);
    Discipline es("CIN0145", "Engenharia de Software", 60, "Processos, requisitos e testes", false);
    es.setTeacher(&helena);
    Discipline calc("MAT0101", "Calculo 1", 90, "Limites, derivadas e integrais", false);
    calc.setTeacher(&rafael);
    Discipline so("CIN0150", "Sistemas Operacionais", 60, "Processos, memoria e arquivos", true);
    so.setTeacher(&ana);
    Discipline ia("CIN0155", "Inteligencia Artificial", 60, "Busca, aprendizado e agentes", false);
    ia.setTeacher(&beatriz);
    Discipline ihc("CIN0160", "Interacao Humano-Computador", 45, "Usabilidade e prototipacao", false);
    ihc.setTeacher(&helena);
    Discipline topicos("CIN0165", "Topicos Especiais", 30, "Tema definido a cada semestre", false);

    // Turmas do semestre passado (2026.1): já encerradas, com situação final calculada
    ClassGroup ipGroup("IP-2026.1", &ip, &carlos, "2026.1", "SEG 8h-10h", 30);
    addResults(ipGroup, joao, 8, 9, 10, 10);       
    addResults(ipGroup, maria, 9, 8, 6, 10);       
    addResults(ipGroup, pedro, 5, 4, 9, 10);       
    addResults(ipGroup, lucas, 7, 7.5, 10, 10);    
    addResults(ipGroup, gabriel, 6, 6, 8, 10);    
    addResults(ipGroup, larissa, 9.5, 10, 10, 10); 
    addResults(ipGroup, mateus, 7, 7, 8, 10);      
    addResults(ipGroup, camila, 8, 6, 7, 10);   
    ipGroup.finish();

    ClassGroup calcGroup("CALC-2026.1", &calc, &rafael, "2026.1", "QUA 14h-16h", 20);
    addResults(calcGroup, joao, 6, 7, 9, 10);
    addResults(calcGroup, maria, 8, 9, 10, 10);
    addResults(calcGroup, julia, 7, 8, 9, 10);
    addResults(calcGroup, lucas, 4, 5, 8, 10);
    addResults(calcGroup, felipe, 9, 8, 10, 10);
    calcGroup.finish();

    ClassGroup bdOld("BD-2026.1", &bd, &beatriz, "2026.1", "QUI 8h-10h", 15);
    addResults(bdOld, pedro, 7, 8, 9, 10);
    addResults(bdOld, mateus, 5, 6, 9, 10);      
    addResults(bdOld, gabriel, 4, 5, 9, 10);     
    addResults(bdOld, larissa, 9, 9, 10, 10);
    bdOld.findEnrollment(mateus)->setFinalGrade(8);
    bdOld.findEnrollment(gabriel)->setFinalGrade(3);
    bdOld.finish();

    // Turmas do semestre atual (2026.2): abertas
    ClassGroup edooGroup("EDOO-2026.2", &edoo, &ana, "2026.2", "TER 10h-12h", 3);   
    addResults(edooGroup, joao, 7.5, 6, 5, 6);
    addResults(edooGroup, maria, 4, 5, 6, 6);
    addResults(edooGroup, julia, 9, 10, 6, 6);

    ClassGroup edGroup("ED-2026.2", &ed, &rafael, "2026.2", "SEG 10h-12h", 25);
    addResults(edGroup, joao, 8, 7.5, 6, 6);
    addResults(edGroup, lucas, 6, 5, 5, 6);
    addResults(edGroup, larissa, 9, 9, 6, 6);
    addResults(edGroup, felipe, 7, 6, 5, 6);
    addResults(edGroup, isabela, 5, 6, 5, 6);
    addResults(edGroup, rodrigo, 3, 4, 3, 6);

    ClassGroup bdGroup("BD-2026.2", &bd, &beatriz, "2026.2", "QUA 8h-10h", 20);
    addResults(bdGroup, pedro, 6.5, 7, 6, 6);
    addResults(bdGroup, julia, 8, 8.5, 6, 6);
    addResults(bdGroup, gabriel, 7, 6, 4, 6);
    addResults(bdGroup, amanda, 9, 7.5, 6, 6);
    addEmpty(bdGroup, thiago);

    ClassGroup redesGroup("REDES-2026.2", &redes, &carlos, "2026.2", "SEX 14h-16h", 20);
    addResults(redesGroup, maria, 7, 8, 6, 6);
    addResults(redesGroup, camila, 6, 6.5, 5, 6);
    addResults(redesGroup, isabela, 8, 9, 6, 6);
    addResults(redesGroup, rodrigo, 5, 5, 4, 6);

    ClassGroup esGroup("ES-2026.2", &es, &helena, "2026.2", "QUI 14h-17h", 12);
    addResults(esGroup, joao, 8, 8, 6, 6);
    addResults(esGroup, julia, 9, 9.5, 6, 6);
    addResults(esGroup, lucas, 6, 7, 5, 6);
    addResults(esGroup, beatrizF, 7.5, 8, 6, 6);
    addResults(esGroup, mateus, 5, 6, 5, 6);

    ClassGroup soGroup("SO-2026.2", &so, &ana, "2026.2", "SEG 14h-16h", 20); 
    addEmpty(soGroup, gabriel);
    addEmpty(soGroup, camila);
    addEmpty(soGroup, felipe);
    addEmpty(soGroup, amanda);

    ClassGroup iaGroup("IA-2026.2", &ia, &beatriz, "2026.2", "SEX 8h-10h", 10);
    addResults(iaGroup, larissa, 10, 9, 6, 6);
    addResults(iaGroup, julia, 8, 9, 6, 6);
    addResults(iaGroup, lucas, 7, 6, 6, 6);

    ClassGroup ihcGroup("IHC-2026.2", &ihc, &helena, "2026.2", "TER 16h-18h", 30);   

    ClassGroup calcNew("CALC-2026.2", &calc, &rafael, "2026.2", "QUA 16h-18h", 30);
    addResults(calcNew, pedro, 5, 6, 5, 6);
    addResults(calcNew, mateus, 7, 7, 6, 6);
    addResults(calcNew, rodrigo, 4, 3, 3, 6);
    addResults(calcNew, thiago, 8, 6, 6, 6);

    // Salva tudo no banco
    TeacherRepository teacherRepo;
    teacherRepo.insert(ana);
    teacherRepo.insert(carlos);
    teacherRepo.insert(beatriz);
    teacherRepo.insert(rafael);
    teacherRepo.insert(helena);
    teacherRepo.insert(tiago);

    StudentRepository studentRepo;
    Student* students[] = {&joao, &maria, &pedro, &julia, &lucas, &beatrizF, &gabriel, &larissa,
                           &mateus, &camila, &felipe, &isabela, &rodrigo, &amanda, &thiago, &sofia};
    for (Student* s : students) studentRepo.insert(*s);

    DisciplineRepository disciplineRepo;
    Discipline* disciplines[] = {&ip, &edoo, &ed, &bd, &redes, &es, &calc, &so, &ia, &ihc, &topicos};
    for (Discipline* d : disciplines) disciplineRepo.insert(*d);

    ClassGroupRepository groupRepo;
    EnrollmentRepository enrollmentRepo;
    ClassGroup* groups[] = {&ipGroup, &calcGroup, &bdOld, &edooGroup, &edGroup, &bdGroup, &redesGroup,
                            &esGroup, &soGroup, &iaGroup, &ihcGroup, &calcNew};
    for (ClassGroup* g : groups) {
        groupRepo.insert(*g);
        enrollmentRepo.saveAll(*g);
    }
}
