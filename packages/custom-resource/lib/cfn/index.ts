import axios from 'axios'

export const send = async (
  event,
  context,
  responseStatus,
  responseData = {}
) => {
  const responseBody = JSON.stringify({
    Status: responseStatus,
    Reason:
      'See the details in CloudWatch Log Stream: ' + context.logStreamName,
    PhysicalResourceId: event.LogicalResourceId,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: responseData
  })

  const res = await axios.put(event.ResponseURL, responseBody, {
    headers: {
      'content-type': '',
      'content-length': responseBody.length
    }
  })

  return res.status
}
