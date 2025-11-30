# MongoDB Database Schema Documentation

## Databases
- set-2-system (Size: 2363392 bytes)
- admin (Size: 364544 bytes)
- local (Size: 2124500992 bytes)

## set-2-system Database

### Collections
- grade_configurations
- notifications
- rooms
- subjects
- grades
- section_students
- activity_logs
- ai_grade_analysis_cache
- teacher_departments
- document_requests
- admin_settings
- sections
- pushSubscriptions
- users
- schedules
- student_todos
- departments
- activity_types

### grade_configurations
```json
{
  "_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      }
    ]
  },
  "section_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      },
      {
        "bsonType": "Null"
      }
    ]
  },
  "subject_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      },
      {
        "bsonType": "Null"
      }
    ]
  },
  "grading_period_id": {
    "types": [
      {
        "bsonType": "Number"
      }
    ]
  },
  "teacher_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      },
      {
        "bsonType": "Null"
      }
    ]
  },
  "grade_items": {
    "types": [
      {
        "bsonType": "Document",
        "fields": {
          "writtenWork": {
            "types": [
              {
                "bsonType": "Array",
                "types": [
                  {
                    "bsonType": "Document",
                    "fields": {
                      "id": {
                        "types": [
                          {
                            "bsonType": "String"
                          }
                        ]
                      },
                      "name": {
                        "types": [
                          {
                            "bsonType": "String"
                          }
                        ]
                      },
                      "totalScore": {
                        "types": [
                          {
                            "bsonType": "Number"
                          }
                        ]
                      }
                    }
                  }
                ]
              }
            ]
          },
          "performanceTasks": {
            "types": [
              {
                "bsonType": "Array",
                "types": [
                  {
                    "bsonType": "Document",
                    "fields": {
                      "id": {
                        "types": [
                          {
                            "bsonType": "String"
                          }
                        ]
                      },
                      "name": {
                        "types": [
                          {
                            "bsonType": "String"
                          }
                        ]
                      },
                      "totalScore": {
                        "types": [
                          {
                            "bsonType": "Number"
                          }
                        ]
                      }
                    }
                  }
                ]
              }
            ]
          },
          "quarterlyAssessment": {
            "types": [
              {
                "bsonType": "Array",
                "types": [
                  {
                    "bsonType": "Document",
                    "fields": {
                      "id": {
                        "types": [
                          {
                            "bsonType": "String"
                          }
                        ]
                      },
                      "name": {
                        "types": [
                          {
                            "bsonType": "String"
                          }
                        ]
                      },
                      "totalScore": {
                        "types": [
                          {
                            "bsonType": "Number"
                          }
                        ]
                      }
                    }
                  }
                ]
              }
            ]
          }
        }
      },
      {
        "bsonType": "Null"
      }
    ]
  },
  "created_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "updated_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "status": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  }
}
```

### notifications
```json
{
  "_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      }
    ]
  },
  "student_id": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "title": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "message": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "type": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "is_read": {
    "types": [
      {
        "bsonType": "Boolean"
      }
    ]
  },
  "created_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "updated_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "created_by": {
    "types": [
      {
        "bsonType": "Null"
      }
    ]
  },
  "priority": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "related_id": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "document_type": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "status": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "admin_name": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "admin_id": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "admin_note": {
    "types": [
      {
        "bsonType": "Null"
      }
    ]
  }
}
```

### rooms
```json
{
  "_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      }
    ]
  },
  "name": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "building": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "floor": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "status": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "assigned_to": {
    "types": [
      {
        "bsonType": "Null"
      }
    ]
  },
  "created_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "updated_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  }
}
```

### subjects
```json
{
  "_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      }
    ]
  },
  "name": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "code": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "grade_level": {
    "types": [
      {
        "bsonType": "Number"
      }
    ]
  },
  "created_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "updated_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "department_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      },
      {
        "bsonType": "Null"
      }
    ]
  }
}
```

### grades
```json
{
  "_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      }
    ]
  },
  "school_year": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "student_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      }
    ]
  },
  "subject_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      }
    ]
  },
  "section_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      }
    ]
  },
  "quarter": {
    "types": [
      {
        "bsonType": "Number"
      }
    ]
  },
  "averages": {
    "types": [
      {
        "bsonType": "Document",
        "fields": {
          "written_work": {
            "types": [
              {
                "bsonType": "Number"
              }
            ]
          },
          "performance_tasks": {
            "types": [
              {
                "bsonType": "Number"
              }
            ]
          },
          "quarterly_assessment": {
            "types": [
              {
                "bsonType": "Number"
              }
            ]
          },
          "final_grade": {
            "types": [
              {
                "bsonType": "Number"
              }
            ]
          }
        }
      }
    ]
  },
  "performance_tasks": {
    "types": [
      {
        "bsonType": "Array",
        "types": [
          {
            "bsonType": "Number"
          }
        ]
      }
    ]
  },
  "quarterly_assessment": {
    "types": [
      {
        "bsonType": "Array",
        "types": [
          {
            "bsonType": "Number"
          }
        ]
      }
    ]
  },
  "updated_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "updated_by": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "verification": {
    "types": [
      {
        "bsonType": "Document",
        "fields": {
          "verified": {
            "types": [
              {
                "bsonType": "Boolean"
              }
            ]
          },
          "verified_by": {
            "types": [
              {
                "bsonType": "Null"
              }
            ]
          },
          "verified_at": {
            "types": [
              {
                "bsonType": "Null"
              }
            ]
          }
        }
      }
    ]
  },
  "written_work": {
    "types": [
      {
        "bsonType": "Array",
        "types": [
          {
            "bsonType": "Number"
          }
        ]
      }
    ]
  },
  "created_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "submitted_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "submitted_by": {
    "types": [
      {
        "bsonType": "ObjectId"
      }
    ]
  },
  "submitted_to_adviser": {
    "types": [
      {
        "bsonType": "Boolean"
      }
    ]
  },
  "teacher_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      }
    ]
  },
  "verified": {
    "types": [
      {
        "bsonType": "Boolean"
      }
    ]
  },
  "verified_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "verified_by": {
    "types": [
      {
        "bsonType": "ObjectId"
      }
    ]
  }
}
```

### section_students
```json
{
  "_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      }
    ]
  },
  "section_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      }
    ]
  },
  "student_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      }
    ]
  },
  "enrolled_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "status": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "removed_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  }
}
```

### activity_logs
```json
{
  "_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      }
    ]
  },
  "activity_type": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "user_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      }
    ]
  },
  "user_account_number": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "activity_data": {
    "types": [
      {
        "bsonType": "Document",
        "fields": {
          "full_name": {
            "types": [
              {
                "bsonType": "String"
              }
            ]
          },
          "account_type": {
            "types": [
              {
                "bsonType": "String"
              }
            ]
          },
          "description": {
            "types": [
              {
                "bsonType": "String"
              }
            ]
          },
          "request_id": {
            "types": [
              {
                "bsonType": "String"
              }
            ]
          },
          "document_type": {
            "types": [
              {
                "bsonType": "String"
              }
            ]
          },
          "old_status": {
            "types": [
              {
                "bsonType": "String"
              }
            ]
          },
          "new_status": {
            "types": [
              {
                "bsonType": "String"
              }
            ]
          },
          "student_name": {
            "types": [
              {
                "bsonType": "String"
              }
            ]
          },
          "student_id": {
            "types": [
              {
                "bsonType": "String"
              }
            ]
          },
          "old_payment_status": {
            "types": [
              {
                "bsonType": "String"
              }
            ]
          },
          "new_payment_status": {
            "types": [
              {
                "bsonType": "String"
              }
            ]
          },
          "payment_status_changed": {
            "types": [
              {
                "bsonType": "Boolean"
              }
            ]
          },
          "status_changed": {
            "types": [
              {
                "bsonType": "Boolean"
              }
            ]
          },
          "schedule_id": {
            "types": [
              {
                "bsonType": "String"
              }
            ]
          },
          "section_name": {
            "types": [
              {
                "bsonType": "String"
              }
            ]
          },
          "grade_level": {
            "types": [
              {
                "bsonType": "Number"
              }
            ]
          },
          "day_of_week": {
            "types": [
              {
                "bsonType": "String"
              }
            ]
          },
          "start_time": {
            "types": [
              {
                "bsonType": "String"
              }
            ]
          },
          "end_time": {
            "types": [
              {
                "bsonType": "String"
              }
            ]
          },
          "schedule_type": {
            "types": [
              {
                "bsonType": "String"
              }
            ]
          },
          "subject_name": {
            "types": [
              {
                "bsonType": "String"
              },
              {
                "bsonType": "Null"
              }
            ]
          },
          "subject_code": {
            "types": [
              {
                "bsonType": "String"
              },
              {
                "bsonType": "Null"
              }
            ]
          },
          "activity_type_name": {
            "types": [
              {
                "bsonType": "Null"
              },
              {
                "bsonType": "String"
              }
            ]
          },
          "teacher_name": {
            "types": [
              {
                "bsonType": "String"
              },
              {
                "bsonType": "Null"
              }
            ]
          },
          "teacher_account_number": {
            "types": [
              {
                "bsonType": "String"
              },
              {
                "bsonType": "Null"
              }
            ]
          },
          "school_year": {
            "types": [
              {
                "bsonType": "String"
              }
            ]
          }
        }
      }
    ]
  },
  "ip_address": {
    "types": [
      {
        "bsonType": "String"
      },
      {
        "bsonType": "Null"
      }
    ]
  },
  "user_agent": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "created_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  }
}
```

### ai_grade_analysis_cache
```json
{
  "_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      }
    ]
  },
  "quarter": {
    "types": [
      {
        "bsonType": "Number"
      }
    ]
  },
  "student_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      }
    ]
  },
  "school_year": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "analysis": {
    "types": [
      {
        "bsonType": "Document",
        "fields": {
          "overallInsight": {
            "types": [
              {
                "bsonType": "String"
              }
            ]
          },
          "performanceLevel": {
            "types": [
              {
                "bsonType": "String"
              }
            ]
          },
          "quarterComparison": {
            "types": [
              {
                "bsonType": "Document",
                "fields": {
                  "overallTrend": {
                    "types": [
                      {
                        "bsonType": "String"
                      }
                    ]
                  },
                  "changeAmount": {
                    "types": [
                      {
                        "bsonType": "Number"
                      }
                    ]
                  },
                  "insight": {
                    "types": [
                      {
                        "bsonType": "String"
                      }
                    ]
                  },
                  "notableChanges": {
                    "types": [
                      {
                        "bsonType": "Array",
                        "types": [
                          {
                            "bsonType": "Document",
                            "fields": {
                              "subject": {
                                "types": [
                                  {
                                    "bsonType": "String"
                                  }
                                ]
                              },
                              "change": {
                                "types": [
                                  {
                                    "bsonType": "Number"
                                  }
                                ]
                              },
                              "observation": {
                                "types": [
                                  {
                                    "bsonType": "String"
                                  }
                                ]
                              }
                            }
                          }
                        ]
                      }
                    ]
                  }
                }
              }
            ]
          },
          "strengths": {
            "types": [
              {
                "bsonType": "Array",
                "types": [
                  {
                    "bsonType": "Document",
                    "fields": {
                      "subject": {
                        "types": [
                          {
                            "bsonType": "String"
                          }
                        ]
                      },
                      "score": {
                        "types": [
                          {
                            "bsonType": "Number"
                          }
                        ]
                      },
                      "reason": {
                        "types": [
                          {
                            "bsonType": "String"
                          }
                        ]
                      }
                    }
                  }
                ]
              }
            ]
          },
          "areasForGrowth": {
            "types": [
              {
                "bsonType": "Array",
                "types": [
                  {
                    "bsonType": "Document",
                    "fields": {
                      "subject": {
                        "types": [
                          {
                            "bsonType": "String"
                          }
                        ]
                      },
                      "score": {
                        "types": [
                          {
                            "bsonType": "Number"
                          }
                        ]
                      },
                      "currentGap": {
                        "types": [
                          {
                            "bsonType": "String"
                          }
                        ]
                      },
                      "potential": {
                        "types": [
                          {
                            "bsonType": "String"
                          }
                        ]
                      }
                    }
                  }
                ]
              }
            ]
          },
          "assessmentInsights": {
            "types": [
              {
                "bsonType": "Document",
                "fields": {
                  "writtenWork": {
                    "types": [
                      {
                        "bsonType": "Document",
                        "fields": {
                          "average": {
                            "types": [
                              {
                                "bsonType": "Number"
                              }
                            ]
                          },
                          "performance": {
                            "types": [
                              {
                                "bsonType": "String"
                              }
                            ]
                          },
                          "insight": {
                            "types": [
                              {
                                "bsonType": "String"
                              }
                            ]
                          }
                        }
                      }
                    ]
                  },
                  "performanceTasks": {
                    "types": [
                      {
                        "bsonType": "Document",
                        "fields": {
                          "average": {
                            "types": [
                              {
                                "bsonType": "Number"
                              }
                            ]
                          },
                          "performance": {
                            "types": [
                              {
                                "bsonType": "String"
                              }
                            ]
                          },
                          "insight": {
                            "types": [
                              {
                                "bsonType": "String"
                              }
                            ]
                          }
                        }
                      }
                    ]
                  },
                  "quarterlyAssessment": {
                    "types": [
                      {
                        "bsonType": "Document",
                        "fields": {
                          "average": {
                            "types": [
                              {
                                "bsonType": "Number"
                              }
                            ]
                          },
                          "performance": {
                            "types": [
                              {
                                "bsonType": "String"
                              }
                            ]
                          },
                          "insight": {
                            "types": [
                              {
                                "bsonType": "String"
                              }
                            ]
                          }
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          "actionPlan": {
            "types": [
              {
                "bsonType": "Array",
                "types": [
                  {
                    "bsonType": "Document",
                    "fields": {
                      "priority": {
                        "types": [
                          {
                            "bsonType": "String"
                          }
                        ]
                      },
                      "title": {
                        "types": [
                          {
                            "bsonType": "String"
                          }
                        ]
                      },
                      "description": {
                        "types": [
                          {
                            "bsonType": "String"
                          }
                        ]
                      },
                      "expectedImpact": {
                        "types": [
                          {
                            "bsonType": "String"
                          }
                        ]
                      }
                    }
                  }
                ]
              }
            ]
          },
          "studyRecommendations": {
            "types": [
              {
                "bsonType": "Document",
                "fields": {
                  "timeManagement": {
                    "types": [
                      {
                        "bsonType": "String"
                      }
                    ]
                  },
                  "focusAreas": {
                    "types": [
                      {
                        "bsonType": "Array",
                        "types": [
                          {
                            "bsonType": "String"
                          }
                        ]
                      }
                    ]
                  },
                  "strengthsToLeverage": {
                    "types": [
                      {
                        "bsonType": "String"
                      }
                    ]
                  }
                }
              }
            ]
          }
        }
      }
    ]
  },
  "created_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "updated_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  }
}
```

### teacher_departments
```json
{
  "_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      }
    ]
  },
  "teacher_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      }
    ]
  },
  "department_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      }
    ]
  }
}
```

### document_requests
```json
{
  "_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      }
    ]
  },
  "student_id": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "account_number": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "full_name": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "grade_level": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "section": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "birthdate": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "document_type": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "quantity": {
    "types": [
      {
        "bsonType": "Number"
      }
    ]
  },
  "request_id": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "submitted_date": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "payment_amount": {
    "types": [
      {
        "bsonType": "Number"
      }
    ]
  },
  "payment_status": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "is_first_time": {
    "types": [
      {
        "bsonType": "Boolean"
      }
    ]
  },
  "status": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "tentative_date": {
    "types": [
      {
        "bsonType": "Null"
      },
      {
        "bsonType": "Date"
      }
    ]
  },
  "is_urgent": {
    "types": [
      {
        "bsonType": "Boolean"
      }
    ]
  },
  "purpose": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "processed_by": {
    "types": [
      {
        "bsonType": "String"
      },
      {
        "bsonType": "Null"
      }
    ]
  },
  "processed_by_id": {
    "types": [
      {
        "bsonType": "String"
      },
      {
        "bsonType": "Null"
      }
    ]
  },
  "messages": {
    "types": [
      {
        "bsonType": "Array",
        "types": [
          {
            "bsonType": "Document",
            "fields": {
              "id": {
                "types": [
                  {
                    "bsonType": "String"
                  }
                ]
              },
              "author": {
                "types": [
                  {
                    "bsonType": "String"
                  }
                ]
              },
              "authorId": {
                "types": [
                  {
                    "bsonType": "Null"
                  },
                  {
                    "bsonType": "String"
                  }
                ]
              },
              "authorRole": {
                "types": [
                  {
                    "bsonType": "String"
                  }
                ]
              },
              "text": {
                "types": [
                  {
                    "bsonType": "String"
                  }
                ]
              },
              "attachments": {
                "types": [
                  {
                    "bsonType": "Array",
                    "types": [
                      {
                        "bsonType": "Document",
                        "fields": {
                          "name": {
                            "types": [
                              {
                                "bsonType": "String"
                              }
                            ]
                          },
                          "type": {
                            "types": [
                              {
                                "bsonType": "String"
                              }
                            ]
                          },
                          "size": {
                            "types": [
                              {
                                "bsonType": "Number"
                              }
                            ]
                          },
                          "data": {
                            "types": [
                              {
                                "bsonType": "String"
                              }
                            ]
                          }
                        }
                      }
                    ]
                  }
                ]
              },
              "created_at": {
                "types": [
                  {
                    "bsonType": "Date"
                  }
                ]
              },
              "isAutomated": {
                "types": [
                  {
                    "bsonType": "Boolean"
                  }
                ]
              }
            }
          }
        ]
      }
    ]
  },
  "status_history": {
    "types": [
      {
        "bsonType": "Array",
        "types": [
          {
            "bsonType": "Document",
            "fields": {
              "status": {
                "types": [
                  {
                    "bsonType": "String"
                  }
                ]
              },
              "timestamp": {
                "types": [
                  {
                    "bsonType": "Date"
                  }
                ]
              },
              "changedBy": {
                "types": [
                  {
                    "bsonType": "String"
                  }
                ]
              },
              "note": {
                "types": [
                  {
                    "bsonType": "String"
                  }
                ]
              }
            }
          }
        ]
      }
    ]
  },
  "created_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "updated_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "last_read_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "compliance_deadline": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  }
}
```

### admin_settings
```json
{
  "_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      }
    ]
  },
  "setting_key": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "setting_value": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "setting_type": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "created_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "updated_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  }
}
```

### sections
```json
{
  "_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      }
    ]
  },
  "name": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "grade_level": {
    "types": [
      {
        "bsonType": "Number"
      }
    ]
  },
  "school_year": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "status": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "created_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "updated_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "deleted_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "adviser_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      }
    ]
  }
}
```

### pushSubscriptions
```json
{
  "_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      }
    ]
  },
  "userId": {
    "types": [
      {
        "bsonType": "Null"
      }
    ]
  },
  "subscription": {
    "types": [
      {
        "bsonType": "Document",
        "fields": {
          "endpoint": {
            "types": [
              {
                "bsonType": "String"
              }
            ]
          },
          "expirationTime": {
            "types": [
              {
                "bsonType": "Null"
              }
            ]
          },
          "keys": {
            "types": [
              {
                "bsonType": "Document",
                "fields": {
                  "p256dh": {
                    "types": [
                      {
                        "bsonType": "String"
                      }
                    ]
                  },
                  "auth": {
                    "types": [
                      {
                        "bsonType": "String"
                      }
                    ]
                  }
                }
              }
            ]
          }
        }
      }
    ]
  },
  "createdAt": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "userAgent": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  }
}
```

### users
```json
{
  "_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      }
    ]
  },
  "account_number": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "account_type": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "first_name": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "last_name": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "middle_initial": {
    "types": [
      {
        "bsonType": "String"
      },
      {
        "bsonType": "Null"
      }
    ]
  },
  "full_name": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "gender": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "email": {
    "types": [
      {
        "bsonType": "String"
      },
      {
        "bsonType": "Null"
      }
    ]
  },
  "grade_level": {
    "types": [
      {
        "bsonType": "String"
      },
      {
        "bsonType": "Null"
      }
    ]
  },
  "birthdate": {
    "types": [
      {
        "bsonType": "Date"
      },
      {
        "bsonType": "Null"
      }
    ]
  },
  "address": {
    "types": [
      {
        "bsonType": "String"
      },
      {
        "bsonType": "Null"
      }
    ]
  },
  "age": {
    "types": [
      {
        "bsonType": "Number"
      },
      {
        "bsonType": "Null"
      }
    ]
  },
  "guardian": {
    "types": [
      {
        "bsonType": "String"
      },
      {
        "bsonType": "Null"
      }
    ]
  },
  "contact_number": {
    "types": [
      {
        "bsonType": "String"
      },
      {
        "bsonType": "Null"
      }
    ]
  },
  "password_hash": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "status": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "created_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "updated_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "last_active_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "archived_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "password_reset_attempts": {
    "types": [
      {
        "bsonType": "Number"
      }
    ]
  },
  "password_reset_code": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "password_reset_expires": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "password_reset_token": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  }
}
```

### schedules
```json
{
  "_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      }
    ]
  },
  "section_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      }
    ]
  },
  "day_of_week": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "start_time": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "end_time": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "schedule_type": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "subject_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      },
      {
        "bsonType": "Null"
      }
    ]
  },
  "activity_type_id": {
    "types": [
      {
        "bsonType": "Null"
      },
      {
        "bsonType": "ObjectId"
      }
    ]
  },
  "teacher_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      },
      {
        "bsonType": "Null"
      }
    ]
  },
  "school_year": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "created_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "updated_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  }
}
```

### student_todos
```json
{
  "_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      }
    ]
  },
  "student_id": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "title": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "description": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "category": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "due_date": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "completed": {
    "types": [
      {
        "bsonType": "Boolean"
      }
    ]
  },
  "created_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "updated_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "completed_at": {
    "types": [
      {
        "bsonType": "Null"
      }
    ]
  }
}
```

### departments
```json
{
  "_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      }
    ]
  },
  "name": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "code": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "status": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "created_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "updated_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  }
}
```

### activity_types
```json
{
  "_id": {
    "types": [
      {
        "bsonType": "ObjectId"
      }
    ]
  },
  "name": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "code": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "color": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "icon": {
    "types": [
      {
        "bsonType": "String"
      }
    ]
  },
  "created_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  },
  "updated_at": {
    "types": [
      {
        "bsonType": "Date"
      }
    ]
  }
}
```