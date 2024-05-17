from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/opencga/webservices/rest/v2/analysis/variant/query', methods=['GET'])
def variant_query():
    print('Received request to /opencga/webservices/rest/v2/analysis/variant/query')
    study = request.args.get('study')
    limit = request.args.get('limit')
    skip = request.args.get('skip')
    count = request.args.get('count')
    includeStudy = request.args.get('includeStudy')
    includeSampleId = request.args.get('includeSampleId')
    type = request.args.get('type')

    # Log the received query parameters
    print('Received query parameters:', request.args)

    # Mock response data
    mock_response = {
        "apiVersion": "v2",
        "time": 330,
        "events": [],
        "params": {
            "includeStudy": "all",
            "study": "demo@family:corpasome",
            "includeSampleId": "true",
            "limit": "10",
            "count": "false",
            "skip": "0"
        },
        "responses": [
            {
                "time": 8,
                "events": [],
                "numResults": 10,
                "results": [
                           {
                    "reference": "A",
                    "type": "SNV",
                    "id": "1:971224:A:G",
                    "studies": [
                        {
                            "stats": [
                                {
                                    "maf": 0.0,
                                    "genotypeCount": {
                                        "0/0": 0,
                                        "0/1": 0,
                                        "1/1": 1
                                    },
                                    "filterCount": {
                                        "PASS": 1
                                    },
                                    "qualityAvg": 76.98,
                                    "sampleCount": 1,
                                    "cohortId": "ALL",
                                    "refAlleleFreq": 0.0,
                                    "altAlleleFreq": 1.0,
                                    "mgf": 0.0,
                                    "mafAllele": "A",
                                    "mgfGenotype": "0/0",
                                    "filterFreq": {
                                        "PASS": 1.0
                                    },
                                    "qualityCount": 1,
                                    "alleleCount": 2,
                                    "fileCount": 1,
                                    "refAlleleCount": 0,
                                    "altAlleleCount": 2,
                                    "genotypeFreq": {
                                        "0/0": 0.0,
                                        "0/1": 0.0,
                                        "1/1": 1.0
                                    },
                                    "missingAlleleCount": 6,
                                    "missingGenotypeCount": 3
                                }
                            ],
                            "scores": [],
                            "samples": [
                                {
                                    "sampleId": "ISDBM322015",
                                    "fileIndex": 0,
                                    "data": [
                                        "1/1",
                                        "0,3",
                                        "3",
                                        "9",
                                        "109,9,0"
                                    ]
                                },
                                {
                                    "sampleId": "ISDBM322016",
                                    "fileIndex": 0,
                                    "data": [
                                        "./.",
                                        "",
                                        "-1",
                                        "-1",
                                        ""
                                    ]
                                },
                                {
                                    "sampleId": "ISDBM322017",
                                    "fileIndex": 0,
                                    "data": [
                                        "./.",
                                        "",
                                        "-1",
                                        "-1",
                                        ""
                                    ]
                                },
                                {
                                    "sampleId": "ISDBM322018",
                                    "fileIndex": 0,
                                    "data": [
                                        "./.",
                                        "",
                                        "-1",
                                        "-1",
                                        ""
                                    ]
                                }
                            ],
                            "issues": [],
                            "studyId": "demo@family:corpasome",
                            "files": [
                                {
                                    "fileId": "quartet.variants.annotated.vcf.gz",
                                    "data": {
                                        "AC": "2",
                                        "set": "variant2",
                                        "FILTER": "PASS",
                                        "MQ": "37.0",
                                        "EFF": "INTRON(MODIFIER||||2045|AGRN||CODING|NM_198576.3|3|1)",
                                        "AF": "1.0",
                                        "Dels": "0.0",
                                        "HaplotypeScore": "0.0",
                                        "MLEAC": "2",
                                        "QUAL": "76.98",
                                        "MLEAF": "1.0",
                                        "DP": "3",
                                        "AN": "2",
                                        "FS": "0.0",
                                        "MQ0": "0",
                                        "SB": "-37.22",
                                        "culprit": "MQ",
                                        "VCF_ID": "rs2799055",
                                        "QD": "25.66",
                                        "VQSLOD": "20.5675",
                                        "ABHom": "1.0",
                                        "DB": "true"
                                    }
                                }
                            ],
                            "secondaryAlternates": [],
                            "sampleDataKeys": [
                                "GT",
                                "AD",
                                "DP",
                                "GQ",
                                "PL"
                            ]
                        }
                    ],
                    "names": [
                        "rs2799055"
                    ],
                    "end": 971224,
                    "start": 971224,
                    "chromosome": "1",
                    "alternate": "G",
                    "strand": "+",
                    "annotation": {
                        "chromosome": "1",
                        "start": 971224,
                        "end": 971224,
                        "reference": "A",
                        "alternate": "G",
                        "additionalAttributes": {
                            "opencga": {
                                "attribute": {
                                    "release": "1"
                                }
                            }
                        }
                    },
                    "length": 1
                },
                ],
                "resultType": "",
                "numTotalResults": -1,
                "numMatches": -1,
                "numInserted": 0,
                "numUpdated": 0,
                "numDeleted": 0,
                "attributes": {
                    "numTotalSamples": 4,
                    "source": "mongodb",
                    "numSamples": 4
                }
            }
        ]
    }
    # trans limit to int
    limit = int(limit)
    # add result into results to meet the limit
    for i in range(1,limit):
        mock_response['responses'][0]['results'].append(mock_response['responses'][0]['results'][0])

    # Send the mock response
    return jsonify(mock_response)

if __name__ == '__main__':
    app.run(host='localhost', port=9191, debug=True)
